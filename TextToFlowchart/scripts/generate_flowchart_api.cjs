#!/usr/bin/env node
/**
 * Mermaid.ink APIを使用してフローチャート画像を生成するスクリプト
 * mermaid-cliがインストールできない環境向けの代替手段
 *
 * Usage: node generate_flowchart_api.cjs <input.mmd> <output.png|output.svg>
 *
 * 依存: なし（Node.js標準モジュールのみ使用）
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function printUsage() {
    console.log('Usage: node generate_flowchart_api.cjs <input.mmd> <output.png|output.svg>');
    console.log('');
    console.log('Arguments:');
    console.log('  input.mmd   - Mermaid記法のファイル');
    console.log('  output      - 出力画像ファイル (.png または .svg)');
    console.log('');
    console.log('Example:');
    console.log('  node generate_flowchart_api.cjs flowchart.mmd diagram.png');
    console.log('');
    console.log('Note: このスクリプトは mermaid.ink API を使用します。');
    console.log('      インターネット接続が必要です。');
}

/**
 * Mermaid記法をBase64エンコードする（mermaid.ink API用）
 */
function encodeMermaid(mermaidCode) {
    // pako互換のdeflate圧縮をzlibで行い、Base64でエンコード
    const compressed = zlib.deflateSync(mermaidCode, { level: 9 });
    // URL-safe Base64
    return compressed.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Mermaid.ink APIから画像を取得
 */
function fetchImage(mermaidCode, outputFormat) {
    return new Promise((resolve, reject) => {
        const encoded = encodeMermaid(mermaidCode);
        const format = outputFormat === 'svg' ? 'svg' : 'img';
        const url = `https://mermaid.ink/${format}/pako:${encoded}`;

        console.log(`API URL: ${url.substring(0, 80)}...`);

        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // リダイレクトを追跡
                https.get(response.headers.location, (redirectResponse) => {
                    handleResponse(redirectResponse, resolve, reject);
                }).on('error', reject);
            } else {
                handleResponse(response, resolve, reject);
            }
        }).on('error', reject);
    });
}

function handleResponse(response, resolve, reject) {
    if (response.statusCode !== 200) {
        reject(new Error(`HTTP Error: ${response.statusCode}`));
        return;
    }

    const chunks = [];
    response.on('data', (chunk) => chunks.push(chunk));
    response.on('end', () => resolve(Buffer.concat(chunks)));
    response.on('error', reject);
}

async function generateFlowchart(inputFile, outputFile) {
    // 入力ファイルの存在確認
    if (!fs.existsSync(inputFile)) {
        console.error(`Error: 入力ファイルが見つかりません: ${inputFile}`);
        process.exit(1);
    }

    // 出力形式の確認
    const ext = path.extname(outputFile).toLowerCase();
    if (ext !== '.png' && ext !== '.svg') {
        console.error('Error: 出力形式は .png または .svg にしてください');
        process.exit(1);
    }

    // 出力ディレクトリの確認・作成
    const outputDir = path.dirname(outputFile);
    if (outputDir && !fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Mermaidファイルを読み込み
    const mermaidCode = fs.readFileSync(inputFile, 'utf-8').trim();

    if (!mermaidCode) {
        console.error('Error: 入力ファイルが空です');
        process.exit(1);
    }

    console.log(`フローチャートを生成中: ${inputFile} -> ${outputFile}`);
    console.log(`Mermaid code length: ${mermaidCode.length} characters`);

    try {
        const outputFormat = ext === '.svg' ? 'svg' : 'png';
        const imageData = await fetchImage(mermaidCode, outputFormat);

        // ファイルに書き込み
        fs.writeFileSync(outputFile, imageData);

        console.log(`Success: フローチャートが生成されました: ${outputFile}`);
        console.log(`File size: ${(imageData.length / 1024).toFixed(2)} KB`);

    } catch (err) {
        console.error(`Error: フローチャートの生成に失敗しました`);
        console.error(err.message);
        console.log('');
        console.log('Hint: Mermaid記法にエラーがある可能性があります。');
        console.log('      https://mermaid.live/ で記法を確認してください。');
        process.exit(1);
    }
}

// メイン処理
const args = process.argv.slice(2);

if (args.length < 2) {
    printUsage();
    process.exit(1);
}

const inputFile = path.resolve(args[0]);
const outputFile = path.resolve(args[1]);

generateFlowchart(inputFile, outputFile);
