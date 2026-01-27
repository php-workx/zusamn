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
  local name="$1"
  local cmd="$2"
  local lines="${3:-10}"

  local output
  local exit_code=0

  output=$(eval "$cmd" 2>&1) || exit_code=$?

  # Show last N lines
  echo "$output" | tail -n "$lines"

  return $exit_code
}

# 1. Secret scan on staged files (blocking - MUST be first!)
echo "→ [1/6] Scanning for secrets..."
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

# 2. Type checking (blocking)
echo "→ [2/6] Type checking..."
if ! run_gate "typecheck" "pnpm typecheck" 5; then
  echo "❌ Type check failed"
  exit 1
fi
echo "  ✓ Types OK"
echo ""

# 3. Lint (blocking)
echo "→ [3/6] Linting..."
if ! run_gate "lint" "pnpm lint" 5; then
  echo "❌ Lint failed"
  exit 1
fi
echo "  ✓ Lint OK"
echo ""

# 4. Fast unit tests (blocking)
echo "→ [4/6] Running fast tests..."
if ! run_gate "test" "pnpm test:unit" 15; then
  echo ""
  echo "❌ Unit tests failed"
  exit 1
fi
echo "  ✓ Tests OK"
echo ""

# 5. Security audit (warning only for medium, blocking for high/critical)
echo "→ [5/6] Security audit..."
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

# 6. Beads status check (warning only)
echo "→ [6/6] Checking task status..."
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
