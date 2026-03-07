# Thinking Corpus — Cursor 插件

一个 Cursor 插件，能够自动捕获 AI Agent 的“思考”（推理）块，并以英文 JSONL 格式保存为语料库。

## 工作原理

本插件会注册一个 `afterAgentThought` 钩子。每当 AI Agent 完成一次思考块时，钩子脚本会提取完整的思考内容和相关元数据，并以一行 JSONL 格式追加到语料文件中。

> **注意：** 你需要使用支持思考能力的模型（例如支持思考的 Claude Opus、o1 等），`afterAgentThought` 钩子才会被触发。

## 安装

### 从 Git 仓库安装

1. 克隆本仓库。
2. 在 Cursor 中，从本地目录安装此插件。

### From Cursor Marketplace

Search for **thinking-corpus** in the Cursor Marketplace and click Install.

## Corpus Output

By default, the corpus is saved to:

```
~/thinking-corpus.jsonl
```

Override the path by setting the environment variable:

```bash
export THINKING_CORPUS_PATH="/path/to/your/corpus.jsonl"
```

### JSONL Record Format

Each line is a JSON object:

```json
{
  "text": "The agent's full thinking text...",
  "timestamp": "2025-03-07T10:30:00.000Z",
  "model": "claude-sonnet-4-20250514",
  "conversation_id": "abc-123",
  "generation_id": "gen-456",
  "duration_ms": 5000
}
```

| Field             | Description                              |
|-------------------|------------------------------------------|
| `text`            | Full thinking block content              |
| `timestamp`       | UTC timestamp when the record was saved  |
| `model`           | Model that generated the thinking        |
| `conversation_id` | Stable conversation identifier           |
| `generation_id`   | Per-generation identifier                |
| `duration_ms`     | How long the thinking block took (ms)    |

## 依赖

- **Node.js** — 采集脚本使用 Node 运行（无需 npm install）。使用 Cursor 的用户一般已安装。若未安装，请从 [nodejs.org](https://nodejs.org) 安装。

  若已安装 **jq** 且希望使用 shell 脚本，可在 `hooks.json` 中改用 `./scripts/capture-thinking.sh`。

## Debugging

1. Open **Cursor Settings** and navigate to the **Hooks** tab to verify the plugin hook is registered.
2. Check the **Hooks output channel** in the Output panel for any script errors.
3. Trigger a conversation with a thinking-capable model and check `~/thinking-corpus.jsonl` for new entries.

## Project Structure

```
thinking-get-hook/
├── .cursor-plugin/
│   └── plugin.json          # Plugin manifest
├── hooks/
│   └── hooks.json           # afterAgentThought hook config
├── scripts/
│   ├── capture-thinking.mjs # 采集脚本（Node，默认）
│   └── capture-thinking.sh  # 可选：shell 版（需安装 jq）
└── README.md
```
## License

MIT


