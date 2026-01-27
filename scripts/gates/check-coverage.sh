#!/bin/bash
# Check test coverage meets minimum thresholds
# Thresholds should be gradually increased as more tests are added
#
# Current targets (MVP phase):
#   Lines: 10% → 80%
#   Branches: 30% → 70%
#   Functions: 20% → 75%
#   Statements: 10% → 80%

set -e

# Check for required tools
command -v jq >/dev/null 2>&1 || { echo "❌ jq is required for coverage parsing"; exit 1; }
command -v bc >/dev/null 2>&1 || { echo "❌ bc is required for numeric comparisons"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR"

# Minimum thresholds (should match vitest.config.ts)
# Start low during MVP, ratchet up over time
MIN_LINES=10
MIN_BRANCHES=30
MIN_FUNCTIONS=20
MIN_STATEMENTS=10

# Check if coverage summary exists
COVERAGE_FILE="coverage/coverage-summary.json"

if [ ! -f "$COVERAGE_FILE" ]; then
  echo "⚠️  No coverage summary found at $COVERAGE_FILE"
  echo "   Run 'pnpm test:coverage' first"
  # In CI, missing coverage file is a failure (prevents bypassing the gate)
  # Locally, allow skipping for development convenience
  if [ -n "$CI" ] || [ -n "$STRICT_COVERAGE" ]; then
    echo "❌ Coverage file required in CI environment"
    exit 1
  fi
  exit 0
fi

# Parse coverage from JSON
LINES=$(jq -r '.total.lines.pct // 0' "$COVERAGE_FILE")
BRANCHES=$(jq -r '.total.branches.pct // 0' "$COVERAGE_FILE")
FUNCTIONS=$(jq -r '.total.functions.pct // 0' "$COVERAGE_FILE")
STATEMENTS=$(jq -r '.total.statements.pct // 0' "$COVERAGE_FILE")

echo "Coverage Report:"
echo "  Lines:      ${LINES}% (min: ${MIN_LINES}%, target: 80%)"
echo "  Branches:   ${BRANCHES}% (min: ${MIN_BRANCHES}%, target: 70%)"
echo "  Functions:  ${FUNCTIONS}% (min: ${MIN_FUNCTIONS}%, target: 75%)"
echo "  Statements: ${STATEMENTS}% (min: ${MIN_STATEMENTS}%, target: 80%)"
echo ""

FAILED=0

# Check each threshold (using bc for float comparison)
if [ "$(echo "$LINES < $MIN_LINES" | bc -l)" -eq 1 ]; then
  echo "❌ Lines coverage ${LINES}% below minimum ${MIN_LINES}%"
  FAILED=1
fi

if [ "$(echo "$BRANCHES < $MIN_BRANCHES" | bc -l)" -eq 1 ]; then
  echo "❌ Branches coverage ${BRANCHES}% below minimum ${MIN_BRANCHES}%"
  FAILED=1
fi

if [ "$(echo "$FUNCTIONS < $MIN_FUNCTIONS" | bc -l)" -eq 1 ]; then
  echo "❌ Functions coverage ${FUNCTIONS}% below minimum ${MIN_FUNCTIONS}%"
  FAILED=1
fi

if [ "$(echo "$STATEMENTS < $MIN_STATEMENTS" | bc -l)" -eq 1 ]; then
  echo "❌ Statements coverage ${STATEMENTS}% below minimum ${MIN_STATEMENTS}%"
  FAILED=1
fi

if [ $FAILED -eq 1 ]; then
  exit 1
fi

echo "✓ All coverage thresholds met"

# Show progress toward targets
echo ""
echo "Progress to targets:"
printf "  Lines:      %s%% of 80%% target (%.0f%% complete)\n" "$LINES" "$(echo "$LINES / 0.8" | bc -l)"
printf "  Branches:   %s%% of 70%% target (%.0f%% complete)\n" "$BRANCHES" "$(echo "$BRANCHES / 0.7" | bc -l)"
printf "  Functions:  %s%% of 75%% target (%.0f%% complete)\n" "$FUNCTIONS" "$(echo "$FUNCTIONS / 0.75" | bc -l)"
printf "  Statements: %s%% of 80%% target (%.0f%% complete)\n" "$STATEMENTS" "$(echo "$STATEMENTS / 0.8" | bc -l)"
