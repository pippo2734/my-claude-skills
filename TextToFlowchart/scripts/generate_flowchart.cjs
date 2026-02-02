#!/usr/bin/env node
/**
 * Mermaidファイルからフローチャート画像を生成するスクリプト
 *
 * Usage: node generate_flowchart.cjs <input.mmd> <output.png|output.svg>
 *
 * 依存: @mermaid-js/mermaid-cli (npm install -g @mermaid-js/mermaid-cli)
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function printUsage() {
    console.log('Usage: node generate_flowchart.cjs <input.mmd> <output.png|output.svg>');
    console.log('');
    console.log('Arguments:');
    console.log('  input.mmd   - Mermaid記法のファイル');
    console.log('  output      - 出力画像ファイル (.png または .svg)');
    console.log('');
    console.log('Example:');
    console.log('  node generate_flowchart.cjs flowchart.mmd diagram.png');
}

function checkMermaidCli() {
    // mmdc (mermaid-cli) がインストールされているか確認
    try {
        execSync('mmdc --version', { stdio: 'pipe' });
        return true;
    } catch {
        return false;
    }
}

function installMermaidCli() {
    console.log('mermaid-cli をインストールしています...');
    try {
        execSync('npm install -g @mermaid-js/mermaid-cli', { stdio: 'inherit' });
        console.log('mermaid-cli のインストールが完了しました。');
        return true;
    } catch (err) {
        console.error('Error: mermaid-cli のインストールに失敗しました。');
        console.error('手動でインストールしてください: npm install -g @mermaid-js/mermaid-cli');
        return false;
    }
}

function generateFlowchart(inputFile, outputFile) {
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

    // mermaid-cli の確認
    if (!checkMermaidCli()) {
        console.log('mermaid-cli が見つかりません。');
        if (!installMermaidCli()) {
            process.exit(1);
        }
    }

    // 設定ファイルを一時的に作成（日本語フォント対応）
    const configPath = path.join(path.dirname(inputFile), '.mermaid-config.json');
    const config = {
        theme: 'default',
        themeVariables: {
            fontFamily: 'sans-serif'
        },
        flowchart: {
            htmlLabels: true,
            curve: 'basis'
        }
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Puppeteer設定（ヘッドレスブラウザ用）
    const puppeteerConfigPath = path.join(path.dirname(inputFile), '.puppeteer-config.json');
    const puppeteerConfig = {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
    fs.writeFileSync(puppeteerConfigPath, JSON.stringify(puppeteerConfig, null, 2));

    // mermaid-cli でフローチャートを生成
    const cmd = `mmdc -i "${inputFile}" -o "${outputFile}" -c "${configPath}" -p "${puppeteerConfigPath}" --scale 2`;

    console.log(`フローチャートを生成中: ${inputFile} -> ${outputFile}`);

    try {
        const result = spawnSync('mmdc', [
            '-i', inputFile,
            '-o', outputFile,
            '-c', configPath,
            '-p', puppeteerConfigPath,
            '--scale', '2'
        ], {
            stdio: 'pipe',
            encoding: 'utf-8'
        });

        if (result.status !== 0) {
            console.error('Error: フローチャートの生成に失敗しました');
            if (result.stderr) {
                console.error(result.stderr);
            }
            // 一時ファイルの削除
            cleanupTempFiles(configPath, puppeteerConfigPath);
            process.exit(1);
        }

        // 成功
        console.log(`Success: フローチャートが生成されました: ${outputFile}`);

        // ファイルサイズの表示
        const stats = fs.statSync(outputFile);
        console.log(`File size: ${(stats.size / 1024).toFixed(2)} KB`);

    } catch (err) {
        console.error(`Error: ${err.message}`);
        cleanupTempFiles(configPath, puppeteerConfigPath);
        process.exit(1);
    }

    // 一時ファイルの削除
    cleanupTempFiles(configPath, puppeteerConfigPath);
}

function cleanupTempFiles(...files) {
    for (const file of files) {
        try {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        } catch {
            // 削除に失敗しても続行
        }
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
