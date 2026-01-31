#!/bin/bash
# Pre-commit quality gates - fast checks (<30s)
# Run before every commit to catch issues early

set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR"

echo ""
echo "════════════════════════════════════════════════════"
echo "  PRE-COMMIT GATES"
echo "════════════════════════════════════════════════════"
echo ""

# Track warnings (non-blocking issues)
WARNINGS=""

# Helper to run command and show last N lines
run_gate() {
  local cmd="$1"
  local lines="${2:-10}"

  local output
  local exit_code=0

  output=$(eval "$cmd" 2>&1) || exit_code=$?

  # Show last N lines
  echo "$output" | tail -n "$lines"

  return $exit_code
}

# 1. Secret scan on staged files (blocking - MUST be first!)
echo "→ [1/7] Scanning for secrets..."
if ! command -v gitleaks &> /dev/null; then
  echo ""
  echo "❌ gitleaks is required but not installed"
  echo ""
  echo "   Install with: brew install gitleaks"
  echo "   Or see: https://github.com/gitleaks/gitleaks#installing"
  exit 1
fi

# Scan only staged changes (fast, catches secrets before they enter history)
if ! gitleaks protect --staged --redact --no-banner 2>/dev/null; then
  echo ""
  echo "❌ SECRETS DETECTED in staged files!"
  echo ""
  echo "   Remove the secret and use environment variables instead."
  echo "   If this is a false positive, add to .gitleaks.toml allowlist."
  exit 1
fi
echo "  ✓ No secrets found"
echo ""

# 2. Auto-format staged files (lint-staged runs biome format --write)
echo "→ [2/7] Formatting staged files..."
if pnpm lint-staged 2>/dev/null; then
  echo "  ✓ Formatted"
else
  echo "  ⚠️  lint-staged failed, trying biome on staged files..."
  STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR)
  if [ -n "$STAGED_FILES" ] && pnpm biome check --write $STAGED_FILES 2>/dev/null; then
    git add -u
    echo "  ✓ Formatted (staged files)"
  else
    echo "  ⚠️  Staged files format failed, formatting entire repo..."
    if ! pnpm format 2>&1 | tail -5; then
      echo ""
      echo "❌ Formatting failed"
      exit 1
    fi
    git add -u
    echo "  ✓ Formatted (full repo)"
  fi
fi
echo ""

# 3. Type checking (blocking)
echo "→ [3/7] Type checking..."
if ! run_gate "pnpm typecheck" 5; then
  echo "❌ Type check failed"
  exit 1
fi
echo "  ✓ Types OK"
echo ""

# 4. Lint (blocking)
echo "→ [4/7] Linting..."
if ! run_gate "pnpm lint" 5; then
  echo "❌ Lint failed"
  exit 1
fi
echo "  ✓ Lint OK"
echo ""

# 5. Fast unit tests (blocking)
echo "→ [5/7] Running fast tests..."
if ! run_gate "pnpm test:unit" 15; then
  echo ""
  echo "❌ Unit tests failed"
  exit 1
fi
echo "  ✓ Tests OK"
echo ""

# 6. Security audit (warning only for medium, blocking for high/critical)
echo "→ [6/7] Security audit..."
AUDIT_OUTPUT=$(pnpm audit --audit-level=high 2>&1) || true
if echo "$AUDIT_OUTPUT" | grep -qE "(critical|high).*vulnerabilit"; then
  echo "❌ Critical/high security vulnerabilities found:"
  echo "$AUDIT_OUTPUT" | tail -20
  exit 1
elif echo "$AUDIT_OUTPUT" | grep -qE "moderate.*vulnerabilit"; then
  WARNINGS="$WARNINGS\n  ⚠️  Moderate security vulnerabilities (run 'pnpm audit' for details)"
fi
echo "  ✓ Security OK"
echo ""

# 7. Beads status check (warning only)
echo "→ [7/7] Checking task status..."
if command -v bd &> /dev/null; then
  IN_PROGRESS=$(bd list --status=in_progress 2>/dev/null | grep -v "^$" | head -5 || true)
  if [ -n "$IN_PROGRESS" ]; then
    WARNINGS="$WARNINGS\n  ⚠️  Tasks still in progress:\n$IN_PROGRESS"
  fi
  echo "  ✓ Beads checked"
else
  echo "  ⚠️  bd CLI not found, skipping beads check"
fi
echo ""

# Summary
echo "════════════════════════════════════════════════════"
if [ -n "$WARNINGS" ]; then
  echo "✅ Pre-commit gates PASSED with warnings:"
  echo -e "$WARNINGS"
else
  echo "✅ Pre-commit gates PASSED"
fi
echo "════════════════════════════════════════════════════"
echo ""
