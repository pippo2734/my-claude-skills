#!/usr/bin/env node

/**
 * インフルエンサー投稿データ収集スクリプト
 *
 * 使用方法:
 *   node collect_posts.cjs --url <GOOGLE_APPS_SCRIPT_URL> --data <JSON_FILE>
 *   node collect_posts.cjs --url <GOOGLE_APPS_SCRIPT_URL> --interactive
 *
 * 環境変数:
 *   INFLUENCER_SHEET_URL - Google Apps ScriptのデプロイURL
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// デフォルト設定
const DEFAULT_CONFIG = {
  sheetUrl: process.env.INFLUENCER_SHEET_URL || '',
  platforms: ['X', 'YouTube', 'note', 'LinkedIn', 'Instagram', 'TikTok', 'Other'],
  categories: ['解説', 'ニュース', '意見/考察', 'チュートリアル', '製品紹介', 'その他']
};

/**
 * Google Apps Scriptにデータを送信
 */
async function sendToSheet(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const protocol = urlObj.protocol === 'https:' ? https : http;

    const req = protocol.request(options, (res) => {
      let body = '';

      // リダイレクトに対応
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        sendToSheet(res.headers.location, data).then(resolve).catch(reject);
        return;
      }

      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (e) {
          resolve({ success: true, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * インタラクティブモードで投稿データを入力
 */
async function interactiveInput() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

  console.log('\n=== インフルエンサー投稿データ入力 ===\n');

  const post = {};

  // プラットフォーム選択
  console.log('プラットフォームを選択:');
  DEFAULT_CONFIG.platforms.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
  const platformIdx = parseInt(await question('番号を入力: ')) - 1;
  post.platform = DEFAULT_CONFIG.platforms[platformIdx] || 'Other';

  post.accountName = await question('アカウント名: ');
  post.accountId = await question('アカウントID (@xxx): ');
  post.postedAt = await question('投稿日時 (YYYY-MM-DD HH:mm:ss): ');
  post.content = await question('投稿内容: ');
  post.likes = parseInt(await question('いいね数: ')) || 0;
  post.reposts = parseInt(await question('リポスト数: ')) || 0;
  post.comments = parseInt(await question('コメント数: ')) || 0;
  post.views = parseInt(await question('閲覧数 (不明なら0): ')) || 0;
  post.postUrl = await question('投稿URL: ');

  const hashtagsRaw = await question('ハッシュタグ (カンマ区切り): ');
  post.hashtags = hashtagsRaw ? hashtagsRaw.split(',').map(h => h.trim()) : [];

  // カテゴリ選択
  console.log('カテゴリを選択:');
  DEFAULT_CONFIG.categories.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
  const categoryIdx = parseInt(await question('番号を入力: ')) - 1;
  post.category = DEFAULT_CONFIG.categories[categoryIdx] || 'その他';

  post.memo = await question('メモ (任意): ');

  rl.close();
  return post;
}

/**
 * JSONファイルから投稿データを読み込み
 */
function loadFromFile(filePath) {
  const absolutePath = path.resolve(filePath);
  const content = fs.readFileSync(absolutePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * ヘルプを表示
 */
function showHelp() {
  console.log(`
インフルエンサー投稿データ収集スクリプト

使用方法:
  node collect_posts.cjs [オプション]

オプション:
  --url <URL>       Google Apps ScriptのデプロイURL（必須）
  --data <FILE>     投稿データのJSONファイル
  --interactive     インタラクティブモードで1件ずつ入力
  --test            接続テスト
  --help            このヘルプを表示

環境変数:
  INFLUENCER_SHEET_URL  デフォルトのGoogle Apps Script URL

JSONファイル形式:
  {
    "posts": [
      {
        "platform": "X",
        "accountName": "AI太郎",
        "accountId": "@ai_taro",
        "postedAt": "2024-01-15 10:30:00",
        "content": "投稿内容...",
        "likes": 100,
        "reposts": 20,
        "comments": 15,
        "views": 5000,
        "postUrl": "https://x.com/...",
        "hashtags": ["生成AI", "Claude"],
        "category": "解説",
        "memo": ""
      }
    ]
  }

例:
  # 接続テスト
  node collect_posts.cjs --url https://script.google.com/... --test

  # JSONファイルからデータを送信
  node collect_posts.cjs --url https://script.google.com/... --data posts.json

  # インタラクティブモード
  node collect_posts.cjs --url https://script.google.com/... --interactive
`);
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    showHelp();
    process.exit(0);
  }

  // URL取得
  const urlIdx = args.indexOf('--url');
  const sheetUrl = urlIdx !== -1 ? args[urlIdx + 1] : DEFAULT_CONFIG.sheetUrl;

  if (!sheetUrl) {
    console.error('エラー: Google Apps Script URLが指定されていません');
    console.error('--url オプションまたは INFLUENCER_SHEET_URL 環境変数を設定してください');
    process.exit(1);
  }

  // テストモード
  if (args.includes('--test')) {
    console.log('接続テスト中...');
    try {
      const result = await sendToSheet(sheetUrl, { posts: [] });
      console.log('接続成功:', result);
    } catch (e) {
      console.error('接続失敗:', e.message);
    }
    process.exit(0);
  }

  // データ送信
  let data;

  if (args.includes('--interactive')) {
    const post = await interactiveInput();
    data = { posts: [post] };
    console.log('\n入力データ:');
    console.log(JSON.stringify(data, null, 2));
  } else {
    const dataIdx = args.indexOf('--data');
    if (dataIdx === -1) {
      console.error('エラー: --data または --interactive オプションが必要です');
      process.exit(1);
    }
    data = loadFromFile(args[dataIdx + 1]);
  }

  console.log('\nデータを送信中...');
  try {
    const result = await sendToSheet(sheetUrl, data);
    console.log('送信成功:', result);
  } catch (e) {
    console.error('送信失敗:', e.message);
    process.exit(1);
  }
}

main().catch(console.error);
