import fs from 'fs';
import os from 'os';

function getCorpusPath() {
  if (process.env.THINKING_CORPUS_PATH) {
    return process.env.THINKING_CORPUS_PATH;
  }
  const home = os.platform() === 'win32' ? process.env.USERPROFILE : process.env.HOME;
  return `${home || os.homedir()}${pathSep()}thinking-corpus.jsonl`;
}

function pathSep() {
  return os.platform() === 'win32' ? '\\' : '/';
}



try {
  const raw = fs.readFileSync(0, 'utf8');
  const input = JSON.parse(raw || '{}');

  const text = input.text ?? '';
  if (typeof text !== 'string' || text.length < 20) {
    process.exit(0);
  }

  const record = {
    text,
    timestamp: new Date().toISOString(),
    model: input.model ?? 'unknown',
    conversation_id: input.conversation_id ?? '',
    generation_id: input.generation_id ?? '',
    duration_ms: Number(input.duration_ms) || 0,
  };

  const corpusPath = getCorpusPath();
  const line = JSON.stringify(record) + '\n';
  fs.appendFileSync(corpusPath, line);
} catch {
  process.exit(0);
}
