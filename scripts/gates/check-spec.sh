#!/bin/bash
# Spec compliance check
# Verifies implementation against functional requirements in spec.md

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR"

SPEC_FILE="specs/001-zusamn-mvp/spec.md"

if [ ! -f "$SPEC_FILE" ]; then
  echo "⚠️  Spec file not found: $SPEC_FILE"
  exit 0
fi

echo "═══════════════════════════════════════════════════════════"
echo "  SPEC COMPLIANCE CHECK"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Extract functional requirements (FR-* patterns)
FR_REQUIREMENTS=$(grep -oE "FR-[A-Z]+-[0-9]+" "$SPEC_FILE" | sort -u || true)
FR_COUNT=$(printf "%s\n" "$FR_REQUIREMENTS" | grep -c "FR-" || true)
FR_COUNT=${FR_COUNT:-0}

echo "Functional Requirements in spec: $FR_COUNT"
echo ""

# Check for test files that reference FR-* requirements
echo "Checking test coverage of requirements..."
echo ""

TESTED_FRS=""
MISSING_FRS=""

for FR in $FR_REQUIREMENTS; do
  # Search for FR reference in test files (exclude heavy dirs in search itself for performance)
  FOUND=$(grep -rl "$FR" \
    --include="*.test.ts" --include="*.test.tsx" --include="*.spec.ts" \
    --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build \
    . 2>/dev/null | head -1 || true)

  if [ -n "$FOUND" ]; then
    TESTED_FRS="$TESTED_FRS $FR"
  else
    MISSING_FRS="$MISSING_FRS $FR"
  fi
done

TESTED_COUNT=$(echo "$TESTED_FRS" | wc -w | tr -d ' ')
MISSING_COUNT=$(echo "$MISSING_FRS" | wc -w | tr -d ' ')

echo "Requirements with tests: $TESTED_COUNT"
echo "Requirements without tests: $MISSING_COUNT"
echo ""

if [ -n "$MISSING_FRS" ]; then
  echo "───────────────────────────────────────────────────────────"
  echo "  MISSING TEST COVERAGE"
  echo "───────────────────────────────────────────────────────────"
  echo ""
  echo "The following requirements have no test references:"
  echo "$MISSING_FRS" | tr ' ' '\n' | grep -v "^$" | head -20
  echo ""
  echo "Consider adding tests for critical requirements."
  echo ""
fi

# Check beads for requirement traceability
echo "───────────────────────────────────────────────────────────"
echo "  BEADS TRACEABILITY"
echo "───────────────────────────────────────────────────────────"
echo ""

if command -v bd &> /dev/null; then
  # Get closed tasks for current phase
  CLOSED_TASKS=$(bd list --status=closed 2>/dev/null | tail -20 || true)

  if [ -n "$CLOSED_TASKS" ]; then
    echo "Recently closed tasks:"
    echo "$CLOSED_TASKS" | head -10
    echo ""
  fi
else
  echo "⚠️  bd CLI not found, skipping traceability check"
fi

echo "───────────────────────────────────────────────────────────"
echo "  IMPLEMENTATION AREAS"
echo "───────────────────────────────────────────────────────────"
echo ""

# Check implementation coverage by area
AREAS=(
  "AUTH:packages/firebase/src/auth"
  "ITEMS:packages/firebase/src/services/itemService"
  "LISTS:packages/firebase/src/services/listService"
  "INVITES:packages/firebase/src/services/inviteService"
  "UI:packages/ui/src"
  "MOBILE:apps/mobile/app"
  "WEB:apps/web/app"
)

for AREA in "${AREAS[@]}"; do
  NAME="${AREA%%:*}"
  PATH="${AREA##*:}"

  if [ -d "$PATH" ] || [ -f "$PATH.ts" ] || [ -f "$PATH.tsx" ]; then
    FILE_COUNT=$(find "$PATH"* -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l | tr -d ' ')
    echo "  ✓ $NAME: $FILE_COUNT files"
  else
    echo "  ⚠️  $NAME: not found ($PATH)"
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Run '/agentops:vibe' for AI-assisted spec review"
echo "═══════════════════════════════════════════════════════════"
echo ""
