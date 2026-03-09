"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type WordFreq = { word: string; count: number };
type PhraseFreq = { phrase: string; count: number };
type VocabData = {
  words: WordFreq[];
  phrases: PhraseFreq[];
  totalTokens: number;
  totalRecords: number;
};

type Tab = "words" | "phrases";

function BarChart({ items }: { items: { name: string; value: number }[] }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ReturnType<typeof import("echarts")["init"]> | null>(null);

  useEffect(() => {
    if (!chartRef.current || items.length === 0) return;
    let disposed = false;

    import("echarts").then((echarts) => {
      if (disposed || !chartRef.current) return;
      if (instanceRef.current) instanceRef.current.dispose();

      const chart = echarts.init(chartRef.current);
      instanceRef.current = chart;

      const top30 = items.slice(0, 30).reverse();
      chart.setOption({
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        grid: { left: 120, right: 30, top: 10, bottom: 30 },
        xAxis: { type: "value" },
        yAxis: {
          type: "category",
          data: top30.map((d) => d.name),
          axisLabel: { fontSize: 12 },
        },
        series: [
          {
            type: "bar",
            data: top30.map((d) => d.value),
            itemStyle: { borderRadius: [0, 4, 4, 0] },
          },
        ],
      });

      const onResize = () => chart.resize();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    });

    return () => {
      disposed = true;
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, [items]);

  if (items.length === 0) return null;
  return <div ref={chartRef} className="h-[500px] w-full" />;
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      placeholder="搜索..."
      className="input input-bordered input-sm w-full max-w-xs"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function VocabStats() {
  const router = useRouter();
  const [data, setData] = useState<VocabData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("words");
  const [search, setSearch] = useState("");
  const [showChart, setShowChart] = useState(true);
  const [starredWords, setStarredWords] = useState<string[]>([]);
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [sortAsc, setSortAsc] = useState(false);
  const [minCount, setMinCount] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch("/api/vocab?wordLimit=1000&phraseLimit=1000")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("vocab_new_words_v1");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setStarredWords(parsed.filter((w): w is string => typeof w === "string"));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("vocab_new_words_v1", JSON.stringify(starredWords));
    } catch {
      // ignore
    }
  }, [starredWords]);

  const filteredWords = useMemo(() => {
    if (!data) return [];
    let items = data.words;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((w) => w.word.includes(q));
    }
    if (onlyStarred) {
      items = items.filter((w) => starredWords.includes(w.word));
    }
    if (minCount > 1) {
      items = items.filter((w) => w.count >= minCount);
    }
    const sorted = [...items].sort((a, b) => (sortAsc ? a.count - b.count : b.count - a.count));
    return sorted;
  }, [data, search, onlyStarred, starredWords, sortAsc, minCount]);

  const filteredPhrases = useMemo(() => {
    if (!data) return [];
    let items = data.phrases;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((p) => p.phrase.includes(q));
    }
    if (minCount > 1) {
      items = items.filter((p) => p.count >= minCount);
    }
    const sorted = [...items].sort((a, b) => (sortAsc ? a.count - b.count : b.count - a.count));
    return sorted;
  }, [data, search, sortAsc, minCount]);

  const toggleStar = (word: string) => {
    setStarredWords((prev) => (prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]));
  };

  const handleExport = () => {
    const items = tab === "words" ? filteredWords : filteredPhrases;
    if (items.length === 0) return;

    const lines = [
      tab === "words" ? "rank,word,count" : "rank,phrase,count",
      ...items.map((item, index) => {
        const text = "word" in item ? item.word : (item as PhraseFreq).phrase;
        const safeText = `"${text.replace(/\"/g, '\"\"')}"`;
        return `${index + 1},${safeText},${item.count}`;
      }),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = tab === "words" ? "vocab_words.csv" : "vocab_phrases.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="card bg-base-200 p-6">
        <span className="loading loading-spinner loading-sm" /> 正在分析词频…
      </div>
    );
  }

  if (!data || (data.words.length === 0 && data.phrases.length === 0)) {
    return (
      <div className="card bg-base-200 p-6">
        <p className="opacity-60">
          暂无数据。请确认 thinking-corpus.jsonl 中有记录。
        </p>
      </div>
    );
  }

  const chartItems = (tab === "words" ? filteredWords : filteredPhrases).map((d) => ({
    name: "word" in d ? d.word : (d as PhraseFreq).phrase,
    value: d.count,
  }));

  const currentItems = tab === "words" ? filteredWords : filteredPhrases;

  return (
    <div className="space-y-6">
      {/* summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Thinking 条数", value: data.totalRecords },
          { label: "总词数（含重复）", value: data.totalTokens.toLocaleString() },
          { label: "不重复单词", value: data.words.length },
          { label: "高频短语", value: data.phrases.length },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{c.value}</p>
          </div>
        ))}
      </div>

      {/* tabs + controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" className="tabs tabs-bordered">
          <button
            type="button"
            role="tab"
            className={`tab ${tab === "words" ? "tab-active" : ""}`}
            onClick={() => {
              setTab("words");
              setSearch("");
            }}
          >
            单词频次
          </button>
          <button
            type="button"
            role="tab"
            className={`tab ${tab === "phrases" ? "tab-active" : ""}`}
            onClick={() => {
              setTab("phrases");
              setSearch("");
            }}
          >
            短语频次
          </button>
        </div>
        <SearchInput value={search} onChange={setSearch} />
        {tab === "words" && (
          <label className="label cursor-pointer gap-2">
            <span className="label-text text-sm">只看生词</span>
            <input
              type="checkbox"
              className="toggle toggle-sm"
              checked={onlyStarred}
              onChange={() => setOnlyStarred((v) => !v)}
            />
          </label>
        )}
        <label className="label cursor-pointer gap-2">
          <span className="label-text text-sm">最小次数</span>
          <select
            className="select select-xs"
            value={minCount}
            onChange={(e) => setMinCount(Number(e.target.value) || 1)}
          >
            <option value={1}>≥1</option>
            <option value={2}>≥2</option>
            <option value={3}>≥3</option>
            <option value={5}>≥5</option>
            <option value={10}>≥10</option>
          </select>
        </label>
        <div className="ml-auto flex items-center gap-2">
          <div className="btn-group btn-group-xs">
            <button
              type="button"
              className={`btn btn-xs ${!sortAsc ? "btn-active" : ""}`}
              onClick={() => setSortAsc(false)}
            >
              次数↓
            </button>
            <button
              type="button"
              className={`btn btn-xs ${sortAsc ? "btn-active" : ""}`}
              onClick={() => setSortAsc(true)}
            >
              次数↑
            </button>
          </div>
          <label className="label cursor-pointer gap-2">
            <span className="label-text text-sm">图表</span>
            <input
              type="checkbox"
              className="toggle toggle-sm"
              checked={showChart}
              onChange={() => setShowChart(!showChart)}
            />
          </label>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={handleExport}
            disabled={currentItems.length === 0}
          >
            导出当前列表
          </button>
        </div>
      </div>

      {/* chart */}
      {showChart && <BarChart items={chartItems} />}

      {/* grid cards */}
      <div className="rounded-xl border border-base-300 p-3">
        {currentItems.length === 0 ? (
          <div className="py-8 text-center opacity-50">无匹配结果</div>
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 lg:grid-cols-4">
            {currentItems.map((item, index) => {
              const isWord = "word" in item;
              const text = isWord ? item.word : (item as PhraseFreq).phrase;
              const starred = isWord && starredWords.includes(text);
              return (
                <div
                  key={text}
                  className={`flex cursor-pointer flex-col justify-between rounded-lg border bg-base-100 p-3 text-sm hover:border-primary/60 hover:bg-base-200 ${
                    starred ? "border-warning" : "border-base-300"
                  }`}
                  onClick={() => {
                    router.push(`/thinking?highlight=${encodeURIComponent(text)}`);
                  }}
                >
                  <div className="mb-2 flex items-start justify-between gap-1">
                    <div className="font-mono text-xs md:text-sm break-words">
                      <span className="mr-1 text-[10px] text-zinc-400">#{index + 1}</span>
                      {text}
                    </div>
                    {isWord && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs px-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(text);
                        }}
                        aria-label={starred ? "取消生词标记" : "标记为生词"}
                      >
                        {starred ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-3 w-3 text-warning"
                          >
                            <path d="M12 2.25l2.955 6.016 6.645.967-4.8 4.68 1.133 6.617L12 17.75l-5.933 3.12 1.133-6.617-4.8-4.68 6.645-.967L12 2.25z" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="h-3 w-3"
                          >
                            <path d="M12 2.75l2.7 5.5 6.05.88-4.375 4.27 1.033 6.02L12 16.96l-5.408 2.91 1.033-6.02L3.25 9.13l6.05-.88L12 2.75z" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{tab === "words" ? "单词" : "短语"}</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                      {item.count} 次
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
