import Link from "next/link";
import { ThinkingList } from "@/components/ThinkingList";

export default function ThinkingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Thinking 语料</h1>
          <nav className="flex gap-4 text-sm">
            <Link href="/" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">首页</Link>
            <Link href="/daily" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">每日</Link>
            <Link href="/thinking" className="font-medium text-zinc-900 dark:text-zinc-50">Thinking</Link>
            <Link href="/sessions" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">会话</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          来自 afterAgentThought 的推理文本，需使用带 thinking 的模型（如 Claude Opus thinking）。
        </p>
        <ThinkingList />
      </main>
    </div>
  );
}
