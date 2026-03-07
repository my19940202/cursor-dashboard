// capture-response-to-txt.mjs — 每次 Agent 回复后触发，写入 ~/thinking-corpus.txt 便于测试
const fs = require('fs');
const os = require('os');

function getPath() {
  return process.env.THINKING_CORPUS_PATH
    ? process.env.THINKING_CORPUS_PATH.replace(/\.jsonl$/, '.txt')
    : `${os.homedir()}/thinking-corpus.txt`;
}

try {
  const raw = fs.readFileSync(0, 'utf8');
  const input = JSON.parse(raw || '{}');

  
  const text = input.text ?? '';
  const line = `[${new Date().toISOString()}] model=${input.model ?? '?'}\n${text}\n---\n`;
  fs.appendFileSync(getPath(), line);
} catch (e) {
  // 静默失败，避免破坏 Hook
}