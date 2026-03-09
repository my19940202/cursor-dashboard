import fs from "fs";
import path from "path";
import os from "os";

const homeDir = os.platform() === "win32" ? process.env.USERPROFILE || os.homedir() : process.env.HOME || os.homedir();

const defaultCorpusPath = path.join(homeDir, "thinking-corpus.jsonl");
const defaultPromptCorpusPath = path.join(homeDir, "prompt-corpus.jsonl");

export function getCorpusPath(): string {
  return process.env.CORPUS_JSONL_PATH || defaultCorpusPath;
}

function getPromptCorpusPath(): string {
  return process.env.PROMPT_CORPUS_PATH || defaultPromptCorpusPath;
}

export type ThinkingRecord = {
  text: string;
  timestamp: string;
  model: string;
  conversation_id: string;
  generation_id: string;
  duration_ms: number;
};

export type ThinkingGroup = {
  user_prompt?: string;
  prompt_timestamp?: string;
  conversation_id: string;
  items: ThinkingRecord[];
};

type PromptRecord = {
  conversation_id: string;
  prompt: string;
  timestamp: string;
};

function readJsonlLines<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  const out: T[] = [];
  for (const line of lines) {
    try {
      out.push(JSON.parse(line) as T);
    } catch {
      // skip
    }
  }
  return out;
}

/**
 * Groups thinking records by their matched prompt.
 * One prompt can trigger multiple thinking records (one-to-many).
 */
function groupByPrompt(thinkingItems: ThinkingRecord[]): ThinkingGroup[] {
  const prompts = readJsonlLines<PromptRecord>(getPromptCorpusPath());

  const promptsByConv = new Map<string, PromptRecord[]>();
  for (const p of prompts) {
    const cid = p.conversation_id || "";
    let list = promptsByConv.get(cid);
    if (!list) {
      list = [];
      promptsByConv.set(cid, list);
    }
    list.push(p);
  }
  for (const list of promptsByConv.values()) {
    list.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  // For each thinking item, find which prompt it belongs to
  type MatchKey = string; // "conversationId::promptTimestamp"
  const groupMap = new Map<MatchKey, ThinkingGroup>();
  const groupOrder: MatchKey[] = [];

  for (const item of thinkingItems) {
    const cid = item.conversation_id || "";
    const candidates = promptsByConv.get(cid);

    let matched: PromptRecord | undefined;
    if (candidates && candidates.length > 0) {
      for (const p of candidates) {
        if (p.timestamp <= item.timestamp) {
          matched = p;
        } else {
          break;
        }
      }
    }

    const key = matched
      ? `${cid}::${matched.timestamp}`
      : `${cid}::no-prompt::${item.generation_id}`;

    let group = groupMap.get(key);
    if (!group) {
      group = {
        user_prompt: matched?.prompt,
        prompt_timestamp: matched?.timestamp,
        conversation_id: cid,
        items: [],
      };
      groupMap.set(key, group);
      groupOrder.push(key);
    }
    group.items.push(item);
  }

  // Sort items within each group by timestamp ascending
  for (const group of groupMap.values()) {
    group.items.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  return groupOrder.map((k) => groupMap.get(k)!);
}

export function getThinking(params: {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
  model?: string;
  highlight?: string;
}): { groups: ThinkingGroup[]; total: number } {
  const { page = 1, pageSize = 20, from, to, model, highlight } = params;
  const filePath = getCorpusPath();
  let items = readJsonlLines<ThinkingRecord>(filePath);

  if (from) items = items.filter((r) => r.timestamp.slice(0, 10) >= from);
  if (to) items = items.filter((r) => r.timestamp.slice(0, 10) <= to);
  if (model) items = items.filter((r) => r.model === model);

  // newest first for grouping order
  items.reverse();

  const allGroups = groupByPrompt(items);

  const filteredGroups = (() => {
    if (!highlight) return allGroups;
    const q = highlight.toLowerCase();
    return allGroups
      .filter((g) => {
        if (g.user_prompt && g.user_prompt.toLowerCase().includes(q)) return true;
        return g.items.some((r) => r.text.toLowerCase().includes(q));
      })
      .map((g) => ({
        ...g,
        items: g.items.filter((r) => r.text.toLowerCase().includes(q)),
      }));
  })();

  const total = filteredGroups.length;
  const start = (page - 1) * pageSize;
  const groups = filteredGroups.slice(start, start + pageSize);

  return { groups, total };
}
