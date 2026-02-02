#!/usr/bin/env python3
"""
RURA 12月拡大クラブ 導入1ヶ月フォローアップMTG スライド生成スクリプト
ルネサンスブランドに沿ったPowerPointを生成します
"""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ブランドカラー（ルネサンス）
RENAISSANCE_RED = RGBColor(230, 0, 18)  # #E60012
GRAY_BAND = RGBColor(217, 217, 217)  # #D9D9D9
BLACK = RGBColor(0, 0, 0)
WHITE = RGBColor(255, 255, 255)
DARK_GRAY = RGBColor(64, 64, 64)

# スライドサイズ（16:9）
SLIDE_WIDTH = Inches(13.333)
SLIDE_HEIGHT = Inches(7.5)


def add_logo_text(slide, prs):
    """右上にルネサンスロゴ（テキスト）を追加"""
    logo_box = slide.shapes.add_textbox(
        Inches(10.5), Inches(0.3), Inches(2.5), Inches(0.5)
    )
    tf = logo_box.text_frame
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.RIGHT

    # "Re" を赤色で
    run1 = p.add_run()
    run1.text = "Re"
    run1.font.size = Pt(18)
    run1.font.bold = True
    run1.font.color.rgb = RENAISSANCE_RED
    run1.font.name = "Arial"

    # "RENAISSANCE" を赤色で
    run2 = p.add_run()
    run2.text = " RENAISSANCE"
    run2.font.size = Pt(18)
    run2.font.bold = True
    run2.font.color.rgb = RENAISSANCE_RED
    run2.font.name = "Arial"


def create_title_slide(prs, title, subtitle=""):
    """タイトルスライド（表紙用）を作成"""
    slide_layout = prs.slide_layouts[6]  # 空白レイアウト
    slide = prs.slides.add_slide(slide_layout)

    # ロゴ追加
    add_logo_text(slide, prs)

    # 中央のグレー帯
    band_top = Inches(2.8)
    band_height = Inches(2.2)
    band = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        Inches(0.8), band_top,
        Inches(11.7), band_height
    )
    band.fill.solid()
    band.fill.fore_color.rgb = GRAY_BAND
    band.line.fill.background()

    # タイトルテキスト
    title_box = slide.shapes.add_textbox(
        Inches(1), Inches(3.0), Inches(11.3), Inches(1.8)
    )
    tf = title_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.text = title
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = BLACK
    p.font.name = "Meiryo"

    # サブタイトル（あれば）
    if subtitle:
        sub_box = slide.shapes.add_textbox(
            Inches(1), Inches(4.5), Inches(11.3), Inches(0.6)
        )
        tf = sub_box.text_frame
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.text = subtitle
        p.font.size = Pt(20)
        p.font.color.rgb = DARK_GRAY
        p.font.name = "Meiryo"

    return slide


def create_section_slide(prs, section_title):
    """セクション区切りスライドを作成"""
    slide_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(slide_layout)

    add_logo_text(slide, prs)

    # 中央のグレー帯（少し小さめ）
    band = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        Inches(1.5), Inches(3.0),
        Inches(10.3), Inches(1.5)
    )
    band.fill.solid()
    band.fill.fore_color.rgb = GRAY_BAND
    band.line.fill.background()

    # セクションタイトル
    title_box = slide.shapes.add_textbox(
        Inches(1.5), Inches(3.15), Inches(10.3), Inches(1.2)
    )
    tf = title_box.text_frame
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.text = section_title
    p.font.size = Pt(32)
    p.font.bold = True
    p.font.color.rgb = BLACK
    p.font.name = "Meiryo"

    return slide


def create_content_slide(prs, title, content_items, highlight_items=None):
    """コンテンツスライドを作成

    Args:
        prs: Presentation object
        title: スライドタイトル
        content_items: コンテンツリスト（文字列のリスト or ネストされたリスト）
        highlight_items: 強調表示するアイテムのインデックスリスト
    """
    if highlight_items is None:
        highlight_items = []

    slide_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(slide_layout)

    add_logo_text(slide, prs)

    # タイトル（上部に赤いアンダーライン付き）
    title_box = slide.shapes.add_textbox(
        Inches(0.5), Inches(0.5), Inches(10), Inches(0.7)
    )
    tf = title_box.text_frame
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(28)
    p.font.bold = True
    p.font.color.rgb = BLACK
    p.font.name = "Meiryo"

    # タイトル下の赤線
    line = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        Inches(0.5), Inches(1.15),
        Inches(12.3), Pt(3)
    )
    line.fill.solid()
    line.fill.fore_color.rgb = RENAISSANCE_RED
    line.line.fill.background()

    # コンテンツ
    content_box = slide.shapes.add_textbox(
        Inches(0.7), Inches(1.5), Inches(12), Inches(5.5)
    )
    tf = content_box.text_frame
    tf.word_wrap = True

    for i, item in enumerate(content_items):
        if isinstance(item, dict):
            # 見出し付きアイテム
            p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
            p.text = item.get('heading', '')
            p.font.size = Pt(20)
            p.font.bold = True
            p.font.color.rgb = RENAISSANCE_RED if item.get('highlight') else BLACK
            p.font.name = "Meiryo"
            p.space_before = Pt(12) if i > 0 else Pt(0)

            # サブアイテム
            for sub_item in item.get('items', []):
                p = tf.add_paragraph()
                p.text = f"• {sub_item}"
                p.font.size = Pt(18)
                p.font.color.rgb = BLACK
                p.font.name = "Meiryo"
                p.level = 1
                p.space_before = Pt(6)
        elif isinstance(item, tuple):
            # (見出し, 内容) のタプル
            p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
            p.text = f"■ {item[0]}"
            p.font.size = Pt(20)
            p.font.bold = True
            p.font.color.rgb = RENAISSANCE_RED
            p.font.name = "Meiryo"
            p.space_before = Pt(16) if i > 0 else Pt(0)

            p = tf.add_paragraph()
            p.text = f"  {item[1]}"
            p.font.size = Pt(18)
            p.font.color.rgb = BLACK
            p.font.name = "Meiryo"
            p.space_before = Pt(4)
        else:
            # 通常のアイテム
            p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
            is_highlight = i in highlight_items

            if item.startswith('・') or item.startswith('•'):
                p.text = item
            else:
                p.text = f"• {item}"

            p.font.size = Pt(18)
            p.font.bold = is_highlight
            p.font.color.rgb = RENAISSANCE_RED if is_highlight else BLACK
            p.font.name = "Meiryo"
            p.space_before = Pt(8)

    return slide


def create_agenda_slide(prs, title, items):
    """アジェンダスライドを作成"""
    slide_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(slide_layout)

    add_logo_text(slide, prs)

    # タイトル
    title_box = slide.shapes.add_textbox(
        Inches(0.5), Inches(0.5), Inches(10), Inches(0.7)
    )
    tf = title_box.text_frame
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(28)
    p.font.bold = True
    p.font.color.rgb = BLACK
    p.font.name = "Meiryo"

    # 赤線
    line = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        Inches(0.5), Inches(1.15),
        Inches(12.3), Pt(3)
    )
    line.fill.solid()
    line.fill.fore_color.rgb = RENAISSANCE_RED
    line.line.fill.background()

    # アジェンダアイテム（番号付き）
    for i, item in enumerate(items, 1):
        y_pos = 1.5 + (i - 1) * 0.8

        # 番号の円
        circle = slide.shapes.add_shape(
            MSO_SHAPE.OVAL,
            Inches(0.8), Inches(y_pos),
            Inches(0.5), Inches(0.5)
        )
        circle.fill.solid()
        circle.fill.fore_color.rgb = RENAISSANCE_RED
        circle.line.fill.background()

        # 番号テキスト
        num_box = slide.shapes.add_textbox(
            Inches(0.8), Inches(y_pos + 0.05),
            Inches(0.5), Inches(0.4)
        )
        tf = num_box.text_frame
        p = tf.paragraphs[0]
        p.text = str(i)
        p.font.size = Pt(18)
        p.font.bold = True
        p.font.color.rgb = WHITE
        p.font.name = "Arial"
        p.alignment = PP_ALIGN.CENTER

        # アジェンダテキスト
        item_box = slide.shapes.add_textbox(
            Inches(1.5), Inches(y_pos + 0.05),
            Inches(10), Inches(0.5)
        )
        tf = item_box.text_frame
        p = tf.paragraphs[0]
        p.text = item
        p.font.size = Pt(20)
        p.font.color.rgb = BLACK
        p.font.name = "Meiryo"

    return slide


def main():
    # プレゼンテーション作成
    prs = Presentation()
    prs.slide_width = SLIDE_WIDTH
    prs.slide_height = SLIDE_HEIGHT

    # ===== スライド0: 表紙 =====
    create_title_slide(
        prs,
        "RURA 12月拡大クラブ\n導入1ヶ月フォローアップMTG",
        "運用状況の確認と標準化に向けたステップ"
    )

    # ===== スライド1: 本MTGの位置付け =====
    create_content_slide(
        prs,
        "1. 本MTGの位置付け",
        [
            ("コンセプト", "共創スタンスでの情報共有・意見交換の場"),
            ("主な目的①", "STEP0の細分化・確認：キックオフ時の内容を実運用レベルで再確認"),
            ("主な目的②", "「クラブの声を聴く会」：現場の課題や要望を吸い上げる"),
            ("主な目的③", "標準とフィードバック：本部の標準オペレーション提示と、現場からのFBを両輪で回す"),
        ]
    )

    # ===== スライド2: 本日のゴール =====
    create_content_slide(
        prs,
        "2. 本日のゴール（終了時の状態）",
        [
            ("決定事項のコミット", "決定事項に基づき、「2月の行動計画（シフト修正案含む）」が提出され、\nコミットメントが得られている状態を目指す"),
            ("実施目的①", "シフト適正化の履行：「適正シフト」の定義を理解し、\n次月以降の作成フロー変更を合意する"),
            ("実施目的②", "標準ルールの適用：統一ルール（1/15決定事項）の\n認識ズレ（自己流）を解消する"),
        ]
    )

    # ===== スライド3: アジェンダ =====
    create_agenda_slide(
        prs,
        "3. アジェンダ",
        [
            "RURA導入ステップ（STEP0）の確認",
            "標準オペレーションの徹底",
            "現場運用の確認事項",
            "帳票格納ルールの標準化",
            "クラブの声を聴く会・質疑応答",
        ]
    )

    # ===== スライド4: セクション【1】 =====
    create_section_slide(
        prs,
        "【1】RURA導入ステップ（STEP0）の確認"
    )

    # ===== スライド5: RURA導入ステップ概要 =====
    create_content_slide(
        prs,
        "【1】RURA導入ステップ（STEP0）の確認",
        [
            ("テーマ", "運用の土台となる「誘導」と「時間の使い方」についての認識合わせ"),
            ("ポイント", "キックオフ時のSTEP0をより解像度を上げて確認します"),
        ]
    )

    # ===== スライド6: 誘導率の振り返り =====
    create_content_slide(
        prs,
        "1-1. 誘導率の振り返り",
        [
            ("現状共有", ""),
            {"heading": "", "items": [
                "12月誘導率の実績",
                "1月誘導率の進捗",
            ]},
            ("メッセージ", "数値に基づいた現状把握"),
        ]
    )

    # ===== スライド7: 適正シフトの考え方 =====
    create_content_slide(
        prs,
        "1-2. 適正シフトの考え方（STEP0再確認）",
        [
            ("定義の確認", "「顧客接点時間」と「非顧客接点時間」の明確化"),
            ("シフト作成ガイドラインの活用", "ガイドラインに沿ったシフト組みができているか？"),
        ]
    )

    # ===== スライド8: 具体的運用基準（シフト） =====
    create_content_slide(
        prs,
        "1-3. 具体的運用基準（シフト）",
        [
            ("基準", "在籍5,500名までのクラブは、「受」１ライン体制"),
            ("対応", "現場から「厳しい」等の声がある場合は、\nセーフィー社による再調査を実施（7月調査結果も参照可）"),
            ("アクション", "【重要】2月シフトより上記基準を反映してください"),
        ]
    )

    # ===== スライド9: セクション【2】 =====
    create_section_slide(
        prs,
        "【2】標準オペレーション"
    )

    # ===== スライド10: 標準オペレーション概要 =====
    create_content_slide(
        prs,
        "【2】標準オペレーション",
        [
            ("テーマ", "早急に対応が必要な実務タスクと期限の指示"),
            ("重要度", "必須（Must）項目の確認"),
        ]
    )

    # ===== スライド11: スクール人数メンテナンス =====
    create_content_slide(
        prs,
        "2-1. スクール人数メンテナンス",
        [
            ("対象範囲拡大", "テニス・トライネーションも含めて実施を徹底"),
            ("現状の課題", "1月10日時点で未完了のクラブあり（該当クラブへの注意喚起）"),
            ("必達期限", "【重要】1月末までに「3月クラス」のメンテナンスを完了させること"),
        ]
    )

    # ===== スライド12: テニスの運用ルール =====
    create_content_slide(
        prs,
        "2-2. テニスの運用ルール",
        [
            ("ルール", "プランニングシートの持参必須"),
            ("詳細", "進級の有無に関わらず、必ず持参が必要となります"),
        ]
    )

    # ===== スライド13: セクション【3】 =====
    create_section_slide(
        prs,
        "【3】現場運用の確認事項"
    )

    # ===== スライド14: 現場運用概要 =====
    create_content_slide(
        prs,
        "【3】現場運用の確認事項",
        [
            ("テーマ", "運用開始後におろそかになりがちな情報のキャッチアップとデータ収集の是正"),
        ]
    )

    # ===== スライド15: 情報連携と機器設定 =====
    create_content_slide(
        prs,
        "3-1. 情報連携と機器設定",
        [
            ("共有メモの確認", "1勤務1回の確認を徹底（情報連携ミスの防止）"),
            ("ネックスピーカー設定", ""),
            {"heading": "", "items": [
                "必ず「有線接続」で使用すること",
                "正しい音量・接続設定の確認",
            ]},
        ]
    )

    # ===== スライド16: データ集約・その他 =====
    create_content_slide(
        prs,
        "3-2. データ集約・その他",
        [
            ("退会理由の集約", "正しい集約方法ができているか再確認"),
            ("掲示板登録", "登録漏れがないか確認"),
        ]
    )

    # ===== スライド17: 帳票格納ルール =====
    create_content_slide(
        prs,
        "【4】帳票格納ルールの標準化",
        [
            ("目的", "事務管理コストを下げるための統一ルール運用"),
            ("格納スケジュール", "【重要】毎月15日格納の徹底"),
            ("運用ルール", "追加格納や修正が発生した場合の手順について"),
        ]
    )

    # ===== スライド18: クラブの声を聴く会 =====
    create_content_slide(
        prs,
        "【5】クラブの声を聴く会・質疑応答",
        [
            ("スタンス", "共創的な課題解決"),
            ("ヒアリング内容", ""),
            {"heading": "", "items": [
                "現場からの質問、要望",
                "発生しているトラブル事例",
                "運用上の課題や改善提案",
            ]},
        ]
    )

    # ===== スライド19: まとめ =====
    create_content_slide(
        prs,
        "まとめ・次回アクション",
        [
            "本日の決定事項の振り返り",
            "次回までのToDo確認",
            {"heading": "特に重要な期限", "items": [
                "シフト修正：2月シフトより反映",
                "メンテナンス期限：1月末まで",
                "帳票格納：毎月15日",
            ], "highlight": True},
        ]
    )

    # 保存
    output_path = "/home/user/my-claude-skills/RURA_followup_mtg.pptx"
    prs.save(output_path)
    print(f"プレゼンテーションを保存しました: {output_path}")
    return output_path


if __name__ == "__main__":
    main()
