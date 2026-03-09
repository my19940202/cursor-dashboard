#!/usr/bin/env bash
# 将本项目的 Cursor Hooks 配置与脚本安装到 ~/.cursor/
set -e
CURSOR_DIR="${HOME}/.cursor"
SCRIPTS_DIR="${CURSOR_DIR}/scripts"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

mkdir -p "$SCRIPTS_DIR"

echo "复制 scripts/*.mjs 到 ${SCRIPTS_DIR}/"
cp -v "$PROJECT_ROOT/scripts/"*.mjs "$SCRIPTS_DIR/"

echo "复制 hooks.json 到 ${CURSOR_DIR}/"
cp -v "$PROJECT_ROOT/hooks/hooks.json" "$CURSOR_DIR/hooks.json"

echo ""
echo "✓ 配置完成。接下来："
echo "  1. 重启 Cursor（若已打开），使 hooks.json 生效。"
echo "  2. 在 Cursor 里随便发一条对话，触发一次 Hooks。"
echo "  3. 刷新仪表盘页面，即可看到数据（默认写入 ~/cursor-events.jsonl 与 ~/thinking-corpus.jsonl）。"
