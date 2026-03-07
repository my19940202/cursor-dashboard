"use client";

import { useEffect, useState } from "react";

type Session = {
  session_id: string;
  reason?: string;
  duration_ms?: number;
  timestamp?: string;
  start?: string;
};

export function SessionTable() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((res) => setSessions(res.sessions ?? []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">加载中…</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-zinc-500 dark:text-zinc-400">暂无会话记录。请确保 Cursor Hooks 已配置 sessionStart / sessionEnd。</p>
      </div>
    );
  }

  function formatMs(ms?: number) {
    if (ms == null) return "—";
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
            <th className="p-3 font-medium text-zinc-700 dark:text-zinc-300">会话 ID</th>
            <th className="p-3 font-medium text-zinc-700 dark:text-zinc-300">结束时间</th>
            <th className="p-3 font-medium text-zinc-700 dark:text-zinc-300">时长</th>
            <th className="p-3 font-medium text-zinc-700 dark:text-zinc-300">结束原因</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.session_id} className="border-b border-zinc-100 dark:border-zinc-700">
              <td className="p-3 font-mono text-zinc-600 dark:text-zinc-400">{s.session_id?.slice(0, 8)}…</td>
              <td className="p-3 text-zinc-600 dark:text-zinc-400">
                {s.timestamp ? s.timestamp.slice(0, 19).replace("T", " ") : "—"}
              </td>
              <td className="p-3 text-zinc-600 dark:text-zinc-400">{formatMs(s.duration_ms)}</td>
              <td className="p-3 text-zinc-600 dark:text-zinc-400">{s.reason ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
