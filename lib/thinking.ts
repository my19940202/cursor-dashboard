import fs from "fs";
import path from "path";
import os from "os";

const defaultCorpusPath = path.join(
  os.platform() === "win32" ? process.env.USERPROFILE || os.homedir() : process.env.HOME || os.homedir(),
  "thinking-corpus.jsonl"
);

export function getCorpusPath(): string {
  return process.env.CORPUS_JSONL_PATH || defaultCorpusPath;
}

export type ThinkingRecord = {
  text: string;
  timestamp: string;
  model: string;
  conversation_id: string;
  generation_id: string;
  duration_ms: number;
};

function readThinkingLines(filePath: string): ThinkingRecord[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  const out: ThinkingRecord[] = [];
  for (const line of lines) {
    try {
      out.push(JSON.parse(line) as ThinkingRecord);
    } catch {
      // skip
    }
  }
  return out;
}

export function getThinking(params: {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
  model?: string;
}): { items: ThinkingRecord[]; total: number } {
  const { page = 1, pageSize = 20, from, to, model } = params;
  const filePath = getCorpusPath();
  let items = readThinkingLines(filePath);
  // newest first
  items = items.reverse();

  if (from) items = items.filter((r) => r.timestamp.slice(0, 10) >= from);
  if (to) items = items.filter((r) => r.timestamp.slice(0, 10) <= to);
  if (model) items = items.filter((r) => r.model === model);

  const total = items.length;
  const start = (page - 1) * pageSize;
  items = items.slice(start, start + pageSize);

  return { items, total };
}
