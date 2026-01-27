#!/bin/bash
# Constitution compliance check
# Reviews changed files against the 9 principles in .specify/memory/constitution.md

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR"

CONSTITUTION_FILE=".specify/memory/constitution.md"

if [ ! -f "$CONSTITUTION_FILE" ]; then
  echo "⚠️  Constitution file not found: $CONSTITUTION_FILE"
  exit 0
fi

# Get changed files (staged or since main)
CHANGED_FILES=$(git diff --name-only --cached 2>/dev/null || true)
if [ -z "$CHANGED_FILES" ]; then
  CHANGED_FILES=$(git diff --name-only origin/main...HEAD 2>/dev/null || git diff --name-only HEAD~5...HEAD 2>/dev/null || true)
fi

if [ -z "$CHANGED_FILES" ]; then
  echo "No changed files to check"
  exit 0
fi

# Filter to only source files
SOURCE_FILES=$(echo "$CHANGED_FILES" | grep -E "\.(ts|tsx|js|jsx)$" | grep -vE "(test|spec|config)" || true)

if [ -z "$SOURCE_FILES" ]; then
  echo "No source files changed"
  exit 0
fi

FILE_COUNT=$(echo "$SOURCE_FILES" | wc -l | tr -d ' ')

echo "═══════════════════════════════════════════════════════════"
echo "  CONSTITUTION REVIEW"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Files to review: $FILE_COUNT"
echo "$SOURCE_FILES" | head -10
if [ "$FILE_COUNT" -gt 10 ]; then
  echo "  ... and $((FILE_COUNT - 10)) more"
fi
echo ""
echo "───────────────────────────────────────────────────────────"
echo "  CHECKLIST (verify manually or with AI review)"
echo "───────────────────────────────────────────────────────────"
echo ""
echo "For each changed file, verify:"
echo ""
echo "[ ] 1. SPEED OVER FEATURES"
echo "       - No unnecessary network calls or latency?"
echo "       - No friction added to core flow (view → add → check)?"
echo ""
echo "[ ] 2. OFFLINE-FIRST"
echo "       - Works without network connection?"
echo "       - Uses Firestore offline persistence?"
echo "       - Never blocks on connectivity?"
echo ""
echo "[ ] 3. COLLABORATION WITHOUT ANNOYANCE"
echo "       - No push notifications added?"
echo "       - No spam potential?"
echo "       - Small trusted group assumption maintained?"
echo ""
echo "[ ] 4. SIMPLICITY OVER POWER"
echo "       - Could this be simpler?"
echo "       - Does it directly improve the core loop?"
echo "       - No scope creep (recipes, pantry, meal planning)?"
echo ""
echo "[ ] 5. CALM, CLEAR DESIGN"
echo "       - Uses established UI patterns?"
echo "       - Consistent with existing components?"
echo "       - Novel UI justified?"
echo ""
echo "[ ] 6. ACCESSIBLE BY DEFAULT"
echo "       - Touch targets ≥ 44pt?"
echo "       - Screen reader labels present?"
echo "       - Text readable?"
echo ""
echo "[ ] 7. PRIVACY AS RESTRAINT"
echo "       - Minimal data collection?"
echo "       - No unnecessary tracking?"
echo "       - No dark patterns?"
echo ""
echo "[ ] 8. FOCUS PROTECTS QUALITY"
echo "       - Staying in scope?"
echo "       - Not stretching too thin?"
echo ""
echo "[ ] 9. BORING OVER CLEVER"
echo "       - Solution is obvious?"
echo "       - Needs minimal documentation?"
echo "       - Easy for next person to understand?"
echo ""
echo "───────────────────────────────────────────────────────────"

# Basic automated checks
echo ""
echo "  AUTOMATED CHECKS:"
echo ""

NEEDS_REVIEW=0

# Helper function to safely grep files (handles spaces in paths)
# Usage: safe_grep_files "pattern" "$SOURCE_FILES"
safe_grep_files() {
  local pattern="$1"
  local files="$2"
  local results=""
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    if grep -lE "$pattern" "$file" 2>/dev/null; then
      results="$results $file"
    fi
  done <<< "$files"
  echo "$results" | xargs
}

# Check for console.log (often indicates debugging leftovers)
CONSOLE_LOGS=$(safe_grep_files "console\.log" "$SOURCE_FILES")
if [ -n "$CONSOLE_LOGS" ]; then
  echo "  ⚠️  console.log found in: $CONSOLE_LOGS"
  NEEDS_REVIEW=1
fi

# Check for TODO/FIXME comments
TODOS=$(safe_grep_files "TODO|FIXME|XXX|HACK" "$SOURCE_FILES")
if [ -n "$TODOS" ]; then
  echo "  ⚠️  TODO/FIXME comments in: $TODOS"
  NEEDS_REVIEW=1
fi

# Check for hardcoded strings that might need i18n
HARDCODED=""
count=0
while IFS= read -r file; do
  [ -z "$file" ] && continue
  [ $count -ge 3 ] && break
  if grep -lE "\"[A-Z][a-z]+ [a-z]+\"" "$file" 2>/dev/null; then
    HARDCODED="$HARDCODED $file"
    count=$((count + 1))
  fi
done <<< "$SOURCE_FILES"
HARDCODED=$(echo "$HARDCODED" | xargs)
if [ -n "$HARDCODED" ]; then
  echo "  ⚠️  Possible hardcoded strings (check i18n): $HARDCODED"
fi

# Check for accessibility issues (missing labels)
# Note: This is a heuristic grep-based check that may miss issues where only some handlers lack labels
A11Y_ISSUES=""
count=0
while IFS= read -r file; do
  [ -z "$file" ] && continue
  [ $count -ge 3 ] && break
  # Check if file has onPress but lacks accessibility attributes
  if grep -lE "onPress=\{" "$file" 2>/dev/null && ! grep -lE "accessible|accessibilityLabel" "$file" 2>/dev/null; then
    A11Y_ISSUES="$A11Y_ISSUES $file"
    count=$((count + 1))
  fi
done <<< "$SOURCE_FILES"
A11Y_ISSUES=$(echo "$A11Y_ISSUES" | xargs)
if [ -n "$A11Y_ISSUES" ]; then
  echo "  ⚠️  Possible missing accessibility labels (heuristic check): $A11Y_ISSUES"
  NEEDS_REVIEW=1
fi

if [ $NEEDS_REVIEW -eq 1 ]; then
  echo ""
  echo "  NEEDS REVIEW - Address warnings above"
else
  echo "  ✓ No automated issues found"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Run '/vibe' for AI-assisted constitution review"
echo "═══════════════════════════════════════════════════════════"
echo ""
