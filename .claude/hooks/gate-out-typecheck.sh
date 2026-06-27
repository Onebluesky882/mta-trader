#!/bin/bash
# Hook: PreToolUse — blocks gate-out write if pnpm type-check fails
# Only triggers for agentic/gate-out/stage-*.md files

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('file_path',''))" 2>/dev/null || echo "")

# Only enforce for gate-out stage files
case "$FILE_PATH" in
  */agentic/gate-out/stage-*.md)
    ;;
  *)
    exit 0
    ;;
esac

ROOT=$(git rev-parse --show-toplevel 2>/dev/null)

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║     Gate-Out Guard: Running pnpm type-check      ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

cd "$ROOT" && pnpm type-check 2>&1
RESULT=$?

if [ $RESULT -ne 0 ]; then
  echo ""
  echo "╔══════════════════════════════════════════════════╗"
  echo "║   BLOCKED: TYPE-CHECK FAILED                     ║"
  echo "║   Fix all TypeScript errors before gate-out      ║"
  echo "╚══════════════════════════════════════════════════╝"
  echo ""
  exit 2
fi

echo ""
echo "✓ type-check passed — gate-out write allowed"
echo ""
exit 0
