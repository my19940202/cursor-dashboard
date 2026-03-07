"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  prompts: number;
  toolCalls: number;
  toolFailures: number;
  sessions: number;
  thoughts: number;
  fileEdits: number;
  contextTokens: number;
};

export function StatCards({ period = "week" }: { period?: "day" | "week" | "month" }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/stats?period=${period}`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">
        无法加载数据，请确认 EVENTS_JSONL_PATH 指向 ~/cursor-events.jsonl 且 Cursor Hooks 已采集事件。
      </p>
    );
  }

  const cards = [
    { label: "提问数", value: stats.prompts, href: "/daily" },
    { label: "工具调用", value: stats.toolCalls, href: "/daily" },
    { label: "会话数", value: stats.sessions, href: "/sessions" },
    { label: "Thinking 条数", value: stats.thoughts, href: "/thinking" },
    { label: "文件编辑", value: stats.fileEdits },
    { label: "上下文 token 约", value: stats.contextTokens > 0 ? stats.contextTokens.toLocaleString() : "—" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {cards.map(({ label, value, href }) => (
        <div
          key={label}
          className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {href ? (
              <Link href={href} className="hover:underline">
                {value}
              </Link>
            ) : (
              value
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
