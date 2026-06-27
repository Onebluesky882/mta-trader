#!/bin/bash
# Hook: PreToolUse — blocks Write/Edit if client type has not been identified
# Enforces: Conductor MUST ask "developer or business owner?" before any work

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('file_path',''))" 2>/dev/null || echo "")

# Only enforce for app source files — skip governance and config files
case "$FILE_PATH" in
  */agentic/*)        exit 0 ;;
  */.claude/*)        exit 0 ;;
  */CLAUDE.md)        exit 0 ;;
  */README.md)        exit 0 ;;
  *.toml|*.json|*.yaml|*.yml) exit 0 ;;
  *.sql)              exit 0 ;;
  *.sh)               exit 0 ;;
  *.md)               exit 0 ;;
  *)                  ;;
esac

ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
CLIENT_TYPE_FILE="$ROOT/agentic/CLIENT_TYPE.md"

# Strip HTML comments and whitespace to get the actual value
if [ -f "$CLIENT_TYPE_FILE" ]; then
  CLIENT_TYPE=$(sed 's/<!--[^>]*-->//g' "$CLIENT_TYPE_FILE" | tr -d '[:space:]' | tr '[:lower:]' '[:upper:]')
else
  CLIENT_TYPE=""
fi

case "$CLIENT_TYPE" in
  DEVELOPER|CLIENT)
    exit 0
    ;;
  "")
    # First-run state — file is blank or comment-only
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║           FIRST-RUN SETUP — ACTION REQUIRED             ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    echo "Before writing any code, identify who is using this template."
    echo ""
    echo "Ask first:"
    echo "  'Are you a developer, or a business owner who wants a website?'"
    echo "  'คุณเป็นนักพัฒนา หรือเจ้าของธุรกิจที่ต้องการสร้างเว็บไซต์?'"
    echo ""
    echo "Then set agentic/CLIENT_TYPE.md to one of:"
    echo "  DEVELOPER   → follows agentic/QUESTIONS.md"
    echo "  CLIENT      → follows agentic/CUSTOMER_SETUP.md"
    echo ""
    echo "Example:"
    echo "  echo 'DEVELOPER' > agentic/CLIENT_TYPE.md"
    echo ""
    exit 2
    ;;
  *)
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║         BLOCKED: CLIENT_TYPE.md HAS INVALID VALUE       ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    echo "agentic/CLIENT_TYPE.md must contain exactly: DEVELOPER or CLIENT"
    echo "Current value: '$CLIENT_TYPE'"
    echo ""
    echo "Fix:"
    echo "  echo 'DEVELOPER' > agentic/CLIENT_TYPE.md"
    echo "  echo 'CLIENT'    > agentic/CLIENT_TYPE.md"
    echo ""
    exit 2
    ;;
esac
