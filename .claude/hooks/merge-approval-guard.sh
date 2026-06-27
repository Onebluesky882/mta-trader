#!/bin/bash
# Hook: PreToolUse — blocks merge-approval write if gate-out does not exist or status != PASS
# Prevents Conductor from self-approving a stage without a validated gate-out

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('file_path',''))" 2>/dev/null || echo "")

# Only enforce for merge-approval files
case "$FILE_PATH" in
  */agentic/merge-approval/stage-*.md)
    ;;
  *)
    exit 0
    ;;
esac

ROOT=$(git rev-parse --show-toplevel 2>/dev/null)

# Extract stage slug from file path: merge-approval/stage-N-domain.md → stage-N-domain
FILENAME=$(basename "$FILE_PATH" .md)
GATE_OUT="$ROOT/agentic/gate-out/$FILENAME.md"

# Check gate-out file exists
if [ ! -f "$GATE_OUT" ]; then
  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║       BLOCKED: GATE-OUT NOT FOUND                       ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo ""
  echo "Cannot write merge-approval without a gate-out file."
  echo ""
  echo "Expected: agentic/gate-out/$FILENAME.md"
  echo ""
  echo "Worker must submit gate-out before Conductor can approve."
  echo ""
  exit 2
fi

# Check gate-out status = PASS
STATUS=$(grep -i "^status:" "$GATE_OUT" | head -1 | sed 's/status://I' | tr -d '[:space:]' | tr '[:lower:]' '[:upper:]')

if [ "$STATUS" != "PASS" ]; then
  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║       BLOCKED: GATE-OUT STATUS IS NOT PASS              ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo ""
  echo "gate-out/$FILENAME.md has status: $STATUS"
  echo ""
  echo "Conductor may only write merge-approval when status: PASS"
  echo "Fix the gate-out or ask the worker to resubmit."
  echo ""
  exit 2
fi

echo ""
echo "✓ gate-out found — status: PASS — merge-approval write allowed"
echo ""
exit 0
