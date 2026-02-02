/**
 * Google Apps Script - インフルエンサー投稿データ収集用
 *
 * セットアップ手順:
 * 1. Google Spreadsheetを新規作成
 * 2. 「拡張機能」→「Apps Script」を開く
 * 3. このコードをコピー&ペースト
 * 4. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」を選択
 * 5. 「アクセスできるユーザー」を「全員」に設定
 * 6. デプロイしてURLをコピー
 */

// スプレッドシートの設定
const SHEET_NAME = 'インフルエンサー投稿データ';

/**
 * 初期セットアップ - ヘッダー行を作成
 * スプレッドシートを開いた状態で「実行」ボタンからこの関数を実行
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // ヘッダー行を設定
  const headers = [
    '収集日時',
    'プラットフォーム',
    'アカウント名',
    'アカウントID',
    '投稿日時',
    '投稿内容',
    'いいね数',
    'リポスト/リツイート数',
    'コメント/リプライ数',
    '閲覧数',
    '投稿URL',
    'メディアURL',
    'ハッシュタグ',
    '言及アカウント',
    'カテゴリ',
    'メモ'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#4285f4');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');

  // 列幅を調整
  sheet.setColumnWidth(1, 150);  // 収集日時
  sheet.setColumnWidth(2, 100);  // プラットフォーム
  sheet.setColumnWidth(3, 120);  // アカウント名
  sheet.setColumnWidth(4, 120);  // アカウントID
  sheet.setColumnWidth(5, 150);  // 投稿日時
  sheet.setColumnWidth(6, 400);  // 投稿内容
  sheet.setColumnWidth(7, 80);   // いいね数
  sheet.setColumnWidth(8, 80);   // リポスト数
  sheet.setColumnWidth(9, 80);   // コメント数
  sheet.setColumnWidth(10, 80);  // 閲覧数
  sheet.setColumnWidth(11, 250); // 投稿URL
  sheet.setColumnWidth(12, 250); // メディアURL
  sheet.setColumnWidth(13, 150); // ハッシュタグ
  sheet.setColumnWidth(14, 150); // 言及アカウント
  sheet.setColumnWidth(15, 100); // カテゴリ
  sheet.setColumnWidth(16, 200); // メモ

  // フィルターを有効化
  sheet.getRange(1, 1, 1, headers.length).createFilter();

  Logger.log('シートのセットアップが完了しました: ' + SHEET_NAME);
}

/**
 * POSTリクエストを処理 - 投稿データを受け取って追加
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const result = addPosts(data);
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GETリクエストを処理 - ステータス確認用
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'Influencer Data Collector API is running',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 投稿データを追加
 * @param {Object} data - 投稿データ（単一または配列）
 */
function addPosts(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    setupSheet();
    sheet = ss.getSheetByName(SHEET_NAME);
  }

  const posts = Array.isArray(data.posts) ? data.posts : [data];
  const now = new Date().toISOString();

  const rows = posts.map(post => [
    now,                                    // 収集日時
    post.platform || '',                    // プラットフォーム
    post.accountName || '',                 // アカウント名
    post.accountId || '',                   // アカウントID
    post.postedAt || '',                    // 投稿日時
    post.content || '',                     // 投稿内容
    post.likes || 0,                        // いいね数
    post.reposts || 0,                      // リポスト数
    post.comments || 0,                     // コメント数
    post.views || 0,                        // 閲覧数
    post.postUrl || '',                     // 投稿URL
    post.mediaUrls ? post.mediaUrls.join(', ') : '',  // メディアURL
    post.hashtags ? post.hashtags.join(', ') : '',    // ハッシュタグ
    post.mentions ? post.mentions.join(', ') : '',    // 言及アカウント
    post.category || '',                    // カテゴリ
    post.memo || ''                         // メモ
  ]);

  // 最終行の次に追加
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, rows.length, rows[0].length).setValues(rows);

  return {
    success: true,
    addedCount: rows.length,
    timestamp: now
  };
}

/**
 * 重複チェック用 - 同じ投稿URLが存在するか確認
 * @param {string} postUrl - チェックする投稿URL
 */
function isDuplicate(postUrl) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) return false;

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;

  const urls = sheet.getRange(2, 11, lastRow - 1, 1).getValues();
  return urls.some(row => row[0] === postUrl);
}

/**
 * 統計情報を取得
 */
function getStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    return { totalPosts: 0, platforms: {} };
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { totalPosts: 0, platforms: {} };
  }

  const data = sheet.getRange(2, 1, lastRow - 1, 16).getValues();

  const platforms = {};
  data.forEach(row => {
    const platform = row[1] || 'unknown';
    platforms[platform] = (platforms[platform] || 0) + 1;
  });

  return {
    totalPosts: data.length,
    platforms: platforms,
    lastUpdated: data[data.length - 1][0]
  };
}

/**
 * テスト用 - サンプルデータを追加
 */
function testAddSampleData() {
  const sampleData = {
    posts: [
      {
        platform: 'X',
        accountName: 'AI太郎',
        accountId: '@ai_taro',
        postedAt: '2024-01-15 10:30:00',
        content: '今日はClaude 3について詳しく解説します！#生成AI #Claude',
        likes: 150,
        reposts: 30,
        comments: 25,
        views: 5000,
        postUrl: 'https://x.com/ai_taro/status/123456789',
        hashtags: ['生成AI', 'Claude'],
        category: '解説',
        memo: 'サンプルデータ'
      }
    ]
  };

  const result = addPosts(sampleData);
  Logger.log(result);
}
