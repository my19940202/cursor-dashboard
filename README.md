# Thinking Corpus — Cursor Plugin

A Cursor Plugin that automatically captures AI Agent "thinking" (reasoning) blocks and saves them as an English corpus in JSONL format.

## How It Works

This plugin registers an `afterAgentThought` hook. Every time the AI Agent completes a thinking block, the hook script extracts the full thinking text along with metadata and appends it as a single JSONL line to a corpus file.

> **Requirement**: You must use a thinking-capable model (e.g., Claude Opus with thinking, o1, etc.) for the `afterAgentThought` hook to fire.

## Installation

### From Git Repository

1. Clone this repository.
2. In Cursor, install the plugin from the local directory.

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

## Dependencies

- **Node.js** — used by the capture script (no npm install needed). Typically already installed for Cursor users. If not, install from [nodejs.org](https://nodejs.org).

  If you have **jq** installed and prefer the shell script, you can use `./scripts/capture-thinking.sh` in `hooks.json` instead of the Node script.

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
│   ├── capture-thinking.mjs # Capture script (Node, default)
│   └── capture-thinking.sh  # Optional: shell version (requires jq)
└── README.md
```

## License

MIT
