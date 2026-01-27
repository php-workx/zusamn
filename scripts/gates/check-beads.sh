#!/bin/bash
# Check that current phase/epic tasks are properly completed
# Ensures all beads issues for the current work are closed before push

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR"

# Check if bd CLI is available
if ! command -v bd &> /dev/null; then
  echo "⚠️  bd CLI not found, skipping beads check"
  echo "   Install beads for task tracking"
  exit 0
fi

# Get current branch name
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")

if [ -z "$CURRENT_BRANCH" ]; then
  echo "⚠️  Not on a branch, skipping beads check"
  exit 0
fi

echo "Branch: $CURRENT_BRANCH"

# Try to detect phase from branch name
# Patterns: phase4-implementation, feature/phase-4, etc.
PHASE_NUM=$(echo "$CURRENT_BRANCH" | grep -oE 'phase[-_]?([0-9]+)' | grep -oE '[0-9]+' | head -1 || true)

if [ -z "$PHASE_NUM" ]; then
  echo "⚠️  Could not detect phase number from branch name"
  echo "   Checking all open tasks instead..."

  # Show open tasks as warning
  OPEN_TASKS=$(bd list --status=open 2>/dev/null | grep -v "epic" | head -10 || true)
  if [ -n "$OPEN_TASKS" ]; then
    echo ""
    echo "Open tasks:"
    echo "$OPEN_TASKS"
    echo ""
    echo "⚠️  Open tasks found (review before pushing)"
  fi
  exit 0
fi

echo "Detected Phase: $PHASE_NUM"
echo ""

# Map phase number to beads prefix pattern
# Phase 4 = zusamn-s3d.4.*
PHASE_PATTERN="zusamn-s3d.${PHASE_NUM}"

echo "Looking for open tasks matching: $PHASE_PATTERN.*"
echo ""

# Get open tasks for this phase (excluding the epic itself)
OPEN_PHASE_TASKS=$(bd list --status=open 2>/dev/null | grep "$PHASE_PATTERN\." | grep -v "\[epic\]" || true)

if [ -n "$OPEN_PHASE_TASKS" ]; then
  echo "❌ Open tasks found for Phase $PHASE_NUM:"
  echo ""
  echo "$OPEN_PHASE_TASKS"
  echo ""
  echo "Close all phase tasks before pushing:"
  echo "  bd close <task-id> --reason=\"...\""
  echo ""
  exit 1
fi

# Check for in_progress tasks
IN_PROGRESS=$(bd list --status=in_progress 2>/dev/null | grep "$PHASE_PATTERN" || true)
if [ -n "$IN_PROGRESS" ]; then
  echo "⚠️  Tasks still in progress:"
  echo "$IN_PROGRESS"
  echo ""
  echo "Complete or close these tasks before pushing."
  exit 1
fi

# Check the phase epic status (use word boundary to avoid partial matches)
PHASE_EPIC=$(bd list --status=open 2>/dev/null | grep -E "${PHASE_PATTERN}([^0-9]|$)" | grep "\[epic\]" || true)
if [ -n "$PHASE_EPIC" ]; then
  echo "⚠️  Phase epic still open: $PHASE_EPIC"
  echo "   Consider closing the epic if all tasks are done."
fi

echo "✓ All Phase $PHASE_NUM tasks are closed"
