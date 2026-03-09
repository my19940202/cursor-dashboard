import fs from "fs";
import { getCorpusPath, type ThinkingRecord } from "./thinking";

export type WordFreq = { word: string; count: number };
export type PhraseFreq = { phrase: string; count: number };
export type VocabResult = {
  words: WordFreq[];
  phrases: PhraseFreq[];
  totalTokens: number;
  totalRecords: number;
};

const STOP_WORDS = new Set([
  // common English
  "the","be","to","of","and","a","in","that","have","i","it","for","not","on",
  "with","he","as","you","do","at","this","but","his","by","from","they","we",
  "her","she","or","an","will","my","one","all","would","there","their","what",
  "so","up","out","if","about","who","get","which","go","me","when","make",
  "can","like","time","no","just","him","know","take","people","into","year",
  "your","good","some","could","them","see","other","than","then","now","look",
  "only","come","its","over","think","also","back","after","use","two","how",
  "our","work","first","well","way","even","new","want","because","any","these",
  "give","day","most","us","is","was","are","been","has","had","did","were",
  "said","each","tell","does","set","three","put","too","here","must","why",
  "let","should","may","am","very","much","more","still","own","need","such",
  "say","right","being","while","where","same","those","long","made","before",
  "since","many","thing","off","through","down","both","between","another",
  "found","really","going","already","got",
  // programming keywords (noise in thinking text)
  "const","var","let","function","return","import","export","class","type",
  "interface","null","undefined","true","false","string","number","boolean",
  "async","await","try","catch","if","else","switch","case","default","break",
  "continue","while","for","new","this","void","typeof","instanceof",
  "file","code","error","value","data","name","param","args","src","app",
]);

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[a-zA-Z_][a-zA-Z0-9_]*\/[a-zA-Z0-9_/.\-]+/g, " ") // file paths
    .replace(/\b[A-Z][a-z]+[A-Z]\w*/g, " ") // camelCase identifiers
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s*>\s?/gm, "");
}

function tokenize(text: string): string[] {
  const cleaned = stripMarkdown(text).toLowerCase();
  return cleaned
    .split(/[^a-z'-]+/)
    .filter((w) => w.length >= 3 && w.length <= 30)
    .filter((w) => !/^\d+$/.test(w))
    .filter((w) => !w.startsWith("'") && !w.endsWith("'"));
}

function readRecords(opts?: {
  from?: string;
  to?: string;
  model?: string;
}): ThinkingRecord[] {
  const filePath = getCorpusPath();
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  let records: ThinkingRecord[] = [];
  for (const line of lines) {
    try {
      records.push(JSON.parse(line) as ThinkingRecord);
    } catch {
      // skip
    }
  }
  if (opts?.from) records = records.filter((r) => r.timestamp.slice(0, 10) >= opts.from!);
  if (opts?.to) records = records.filter((r) => r.timestamp.slice(0, 10) <= opts.to!);
  if (opts?.model) records = records.filter((r) => r.model === opts.model);
  return records;
}

function countWords(tokens: string[]): WordFreq[] {
  const freq = new Map<string, number>();
  for (const t of tokens) {
    if (STOP_WORDS.has(t)) continue;
    freq.set(t, (freq.get(t) || 0) + 1);
  }
  return Array.from(freq.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
}

function extractPhrases(tokens: string[], minCount = 2): PhraseFreq[] {
  const freq2 = new Map<string, number>();
  const freq3 = new Map<string, number>();

  const meaningful = tokens.filter((t) => !STOP_WORDS.has(t));

  for (let i = 0; i < meaningful.length - 1; i++) {
    const bigram = `${meaningful[i]} ${meaningful[i + 1]}`;
    freq2.set(bigram, (freq2.get(bigram) || 0) + 1);
  }
  for (let i = 0; i < meaningful.length - 2; i++) {
    const trigram = `${meaningful[i]} ${meaningful[i + 1]} ${meaningful[i + 2]}`;
    freq3.set(trigram, (freq3.get(trigram) || 0) + 1);
  }

  const result: PhraseFreq[] = [];
  for (const [phrase, count] of freq2) {
    if (count >= minCount) result.push({ phrase, count });
  }
  for (const [phrase, count] of freq3) {
    if (count >= minCount) result.push({ phrase, count });
  }
  return result.sort((a, b) => b.count - a.count);
}

// In-memory cache keyed by file mtime + filter params + limits
let cache: { key: string; data: VocabResult } | null = null;

function getCacheKey(opts?: {
  from?: string;
  to?: string;
  model?: string;
  wordLimit?: number;
  phraseLimit?: number;
}): string {
  const filePath = getCorpusPath();
  let mtime = "0";
  try {
    mtime = fs.statSync(filePath).mtimeMs.toString();
  } catch {
    // file may not exist
  }
  return [
    mtime,
    opts?.from || "",
    opts?.to || "",
    opts?.model || "",
    String(opts?.wordLimit ?? ""),
    String(opts?.phraseLimit ?? ""),
  ].join(":");
}

export function getVocabStats(opts?: {
  from?: string;
  to?: string;
  model?: string;
  wordLimit?: number;
  phraseLimit?: number;
}): VocabResult {
  const key = getCacheKey(opts);
  if (cache && cache.key === key) return cache.data;

  const records = readRecords(opts);
  const allTokens: string[] = [];
  for (const r of records) {
    allTokens.push(...tokenize(r.text));
  }

  const words = countWords(allTokens).slice(0, opts?.wordLimit ?? 200);
  const phrases = extractPhrases(allTokens, 2).slice(0, opts?.phraseLimit ?? 200);

  const data: VocabResult = {
    words,
    phrases,
    totalTokens: allTokens.length,
    totalRecords: records.length,
  };
  cache = { key, data };
  return data;
}
