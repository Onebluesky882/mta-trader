#!/bin/bash
# Hook: PreToolUse — blocks destructive git operations on main branch
# Protects client data from accidental loss

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('command',''))" 2>/dev/null || echo "")

# Only check Bash tool calls
if [ -z "$COMMAND" ]; then
  exit 0
fi

BLOCKED=""

# force push to main
if echo "$COMMAND" | grep -qE "git push.*(--force|-f).*main|git push.*main.*(--force|-f)"; then
  BLOCKED="force push to main"
fi

# hard reset
if echo "$COMMAND" | grep -qE "git reset --hard"; then
  BLOCKED="git reset --hard"
fi

# delete main branch
if echo "$COMMAND" | grep -qE "git branch -[Dd] main|git branch --delete main"; then
  BLOCKED="delete main branch"
fi

# checkout -- (discard all changes)
if echo "$COMMAND" | grep -qE "git checkout -- \.|git restore \. "; then
  BLOCKED="discard all working changes"
fi

if [ -n "$BLOCKED" ]; then
  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║       BLOCKED: DESTRUCTIVE GIT OPERATION                ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo ""
  echo "Command blocked: $BLOCKED"
  echo "Command: $COMMAND"
  echo ""
  echo "This operation can cause permanent data loss."
  echo "If you are certain, ask Dev to run it manually."
  echo ""
  exit 2
fi

exit 0
