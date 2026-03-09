import { VocabStats } from "@/components/VocabStats";

export default function VocabPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="mb-4 text-sm opacity-60">
        从 Thinking 语料中提取的高频单词与短语统计，基于 n-gram 分词 + 停用词过滤。
      </p>
      <VocabStats />
    </main>
  );
}
