"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ThinkingRecord = {
  text: string;
  timestamp: string;
  model: string;
  conversation_id: string;
  generation_id: string;
  duration_ms: number;
};

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="leading-relaxed">{children}</li>,
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm dark:bg-zinc-800">{children}</code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="mb-2 overflow-x-auto rounded bg-zinc-100 p-3 text-sm dark:bg-zinc-800">{children}</pre>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold">{children}</strong>,
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline dark:text-blue-400">
      {children}
    </a>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="mb-2 mt-3 text-lg font-semibold">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="mb-2 mt-3 text-base font-semibold">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="mb-1 mt-2 text-sm font-semibold">{children}</h3>,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-zinc-300 pl-3 text-zinc-600 dark:border-zinc-600 dark:text-zinc-400">
      {children}
    </blockquote>
  ),
};

function ThinkingItem({ record }: { record: ThinkingRecord }) {
  const [expanded, setExpanded] = useState(false);
  const lineCount = (record.text.match(/\n/g) ?? []).length + 1;
  const canExpand = lineCount > 4;

  return (
    <li className="p-4">
      <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <span>{record.timestamp.slice(0, 19).replace("T", " ")}</span>
        <span>{record.model}</span>
        <span>{record.duration_ms}ms</span>
      </div>
      <div
        className={`mt-1 break-words text-zinc-800 dark:text-zinc-200 ${expanded ? "" : "line-clamp-4"}`}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {record.text}
        </ReactMarkdown>
      </div>
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 text-sm font-medium text-zinc-600 hover:underline dark:text-zinc-400"
        >
          {expanded ? "收起" : "展开"}
        </button>
      )}
    </li>
  );
}

export function ThinkingList() {
  const [items, setItems] = useState<ThinkingRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/thinking?page=${page}&pageSize=${pageSize}`)
      .then((r) => r.json())
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [page]);

  if (loading && items.length === 0) {
    return <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">加载中…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-zinc-500 dark:text-zinc-400">暂无 Thinking 记录。请使用带 thinking 的模型（如 Claude Opus thinking）并确保 Hooks 已采集。</p>
      </div>
    );
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {items.map((r, i) => (
            <ThinkingItem key={`${r.conversation_id}-${r.generation_id}-${i}`} record={r} />
          ))}
        </ul>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">共 {total} 条</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-zinc-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-zinc-600"
          >
            上一页
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-zinc-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-zinc-600"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
