---
name: influencer-data-collector
description: 生成AIインフルエンサーのSNS投稿をGoogleスプレッドシートに自動収集する。分析用データの蓄積に使用
---

# インフルエンサー投稿データ収集スキル

生成AIを発信しているインフルエンサーのSNS投稿を収集し、Googleスプレッドシートに自動保存するワークフロー。

## できること

- X (Twitter)、YouTube、note、LinkedIn等の投稿データを構造化して収集
- Google Spreadsheetへの自動書き込み
- 収集データのカテゴリ分類（解説/ニュース/意見・考察/チュートリアル/製品紹介）
- エンゲージメント指標（いいね/リポスト/コメント/閲覧数）の記録

## セットアップ

### Step 1: Googleスプレッドシートの準備

1. 新しいGoogleスプレッドシートを作成
2. 「拡張機能」→「Apps Script」を開く
3. `scripts/google_apps_script.js` の内容をコピー&ペースト
4. `setupSheet()` 関数を実行してヘッダーを作成
5. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」を選択
6. 実行者: 自分、アクセス: 全員 に設定
7. デプロイしてURLをコピー（後で使用）

### Step 2: 環境変数の設定（任意）

```bash
export INFLUENCER_SHEET_URL="https://script.google.com/macros/s/..."
```

## 使い方

### 方法1: Claudeに投稿を収集してもらう

ユーザーがインフルエンサーのプロフィールURLや投稿URLを提示すると、Claudeが以下を実行：

1. WebFetchで投稿内容を取得
2. 投稿データをJSON形式に構造化
3. `scripts/collect_posts.cjs` でスプレッドシートに送信

**例:**
```
「@ai_taroの最新の投稿を収集して」
「このURL（https://x.com/...）の投稿をスプレッドシートに追加して」
```

### 方法2: JSONファイルから一括登録

```bash
node scripts/collect_posts.cjs \
  --url "https://script.google.com/macros/s/..." \
  --data scripts/sample_posts.json
```

### 方法3: インタラクティブモード

```bash
node scripts/collect_posts.cjs \
  --url "https://script.google.com/macros/s/..." \
  --interactive
```

## データ構造

### 収集する情報

| フィールド | 説明 | 例 |
|-----------|------|-----|
| platform | SNSプラットフォーム | X, YouTube, note |
| accountName | 表示名 | AI太郎 |
| accountId | アカウントID | @ai_taro |
| postedAt | 投稿日時 | 2024-01-15 10:30:00 |
| content | 投稿テキスト | Claude 3がリリース... |
| likes | いいね数 | 1520 |
| reposts | リポスト/RT数 | 320 |
| comments | コメント数 | 85 |
| views | 閲覧数 | 50000 |
| postUrl | 投稿URL | https://x.com/... |
| hashtags | ハッシュタグ | ["生成AI", "Claude"] |
| category | カテゴリ | ニュース |
| memo | メモ | 任意のメモ |

### JSONフォーマット

```json
{
  "posts": [
    {
      "platform": "X",
      "accountName": "AI太郎",
      "accountId": "@ai_taro",
      "postedAt": "2024-01-15 10:30:00",
      "content": "投稿内容...",
      "likes": 1520,
      "reposts": 320,
      "comments": 85,
      "views": 50000,
      "postUrl": "https://x.com/ai_taro/status/123456789",
      "hashtags": ["生成AI", "Claude"],
      "category": "ニュース",
      "memo": ""
    }
  ]
}
```

## Claudeによる収集ワークフロー

ユーザーから投稿収集のリクエストを受けた場合:

1. **URLが提供された場合**
   - WebFetchツールでページ内容を取得
   - 投稿データを抽出してJSON形式に変換
   - ユーザーに確認後、スプレッドシートに送信

2. **アカウント名のみの場合**
   - WebSearchで該当アカウントを検索
   - プロフィールページURLを特定
   - 投稿を収集

3. **収集データの確認**
   - 抽出したデータをユーザーに提示
   - 修正があれば反映
   - 確認後に送信

## 分析用途の例

収集したデータは以下の分析に活用可能：

- **トレンド分析**: 生成AI関連の話題の推移
- **エンゲージメント分析**: 反応の良いコンテンツタイプの特定
- **インフルエンサー比較**: フォロワー数とエンゲージメント率の関係
- **コンテンツ分類**: カテゴリ別の投稿頻度分析
- **時系列分析**: 投稿タイミングとエンゲージメントの相関

## 注意事項

- 各SNSの利用規約を遵守してください
- 個人情報の取り扱いに注意してください
- 大量の自動収集は各プラットフォームの制限に抵触する可能性があります
- 収集データは分析目的のみに使用してください
