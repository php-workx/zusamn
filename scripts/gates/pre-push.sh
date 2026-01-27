#!/bin/bash
# Pre-push quality gates - thorough checks (<5min)
# Run before pushing to ensure code meets all quality standards

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR"

echo ""
echo "════════════════════════════════════════════════════"
echo "  PRE-PUSH GATES (Thorough)"
echo "════════════════════════════════════════════════════"
echo ""

# Track warnings and advisory issues
WARNINGS=""
ADVISORY=""

# ─────────────────────────────────────────────────────
# HARD GATES (Blocking)
# ─────────────────────────────────────────────────────

echo "━━━ HARD GATES ━━━"
echo ""

# 1. All tests with coverage (blocking)
echo "→ [1/7] Running all tests with coverage..."
if ! pnpm test:coverage 2>&1 | tail -15; then
  echo "❌ Tests failed"
  exit 1
fi
echo "  ✓ All tests passed"
echo ""

# 2. Coverage thresholds (blocking)
echo "→ [2/7] Checking coverage thresholds..."
if ! "$SCRIPT_DIR/check-coverage.sh"; then
  echo "❌ Coverage thresholds not met"
  exit 1
fi
echo "  ✓ Coverage OK"
echo ""

# 3. Build all packages (blocking)
echo "→ [3/7] Building all packages..."
if ! pnpm build 2>&1 | tail -10; then
  echo "❌ Build failed"
  exit 1
fi
echo "  ✓ Build OK"
echo ""

# 4. Secret scan (blocking)
echo "→ [4/7] Scanning for secrets..."
if ! "$SCRIPT_DIR/check-secrets.sh"; then
  echo "❌ Secrets detected! Review and remove before pushing."
  exit 1
fi
echo "  ✓ No secrets found"
echo ""

# 5. Security audit (blocking for high/critical)
echo "→ [5/7] Security audit..."
AUDIT_EXIT=0
AUDIT_OUTPUT=$(pnpm audit --audit-level=high 2>&1) || AUDIT_EXIT=$?
if [ $AUDIT_EXIT -ne 0 ]; then
  echo "❌ Critical/high security vulnerabilities found"
  echo "$AUDIT_OUTPUT" | tail -20
  exit 1
fi
echo "  ✓ Security OK"
echo ""

# 6. Phase tasks completion (blocking)
echo "→ [6/7] Checking phase completion..."
if ! "$SCRIPT_DIR/check-beads.sh"; then
  echo "❌ Phase tasks not complete"
  exit 1
fi
echo "  ✓ Phase tasks OK"
echo ""

# 7. Firestore rules tests (if available)
echo "→ [7/7] Firestore rules tests..."
if [ -f "firebase/functions/package.json" ]; then
  if pnpm --filter @zusamn/functions test 2>&1 | tail -5; then
    echo "  ✓ Rules tests OK"
  else
    WARNINGS="$WARNINGS\n  ⚠️  Firestore rules tests failed (non-blocking)"
  fi
else
  echo "  ⚠️  Firestore functions not found, skipping"
fi
echo ""

# ─────────────────────────────────────────────────────
# SOFT GATES (Advisory)
# ─────────────────────────────────────────────────────

echo "━━━ SOFT GATES (Advisory) ━━━"
echo ""

# 8. Constitution check (advisory)
echo "→ [8/10] Constitution review..."
CONSTITUTION_OUTPUT=$("$SCRIPT_DIR/check-constitution.sh" 2>&1) || true
if echo "$CONSTITUTION_OUTPUT" | grep -q "NEEDS REVIEW"; then
  ADVISORY="$ADVISORY\n  📋 Constitution: Manual review recommended"
fi
echo "$CONSTITUTION_OUTPUT"
echo ""

# 9. Spec compliance (advisory)
echo "→ [9/10] Spec compliance..."
SPEC_OUTPUT=$("$SCRIPT_DIR/check-spec.sh" 2>&1) || true
if echo "$SPEC_OUTPUT" | grep -q "MISSING"; then
  ADVISORY="$ADVISORY\n  📋 Spec: Some requirements may need verification"
fi
echo "$SPEC_OUTPUT"
echo ""

# 10. PR-style diff review summary
echo "→ [10/10] Diff summary..."
DIFF_STATS=$(git diff --stat origin/main...HEAD 2>/dev/null | tail -5 || git diff --stat HEAD~5...HEAD | tail -5)
echo "$DIFF_STATS"
echo ""

# ─────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────

echo "════════════════════════════════════════════════════"
echo "  GATE SUMMARY"
echo "════════════════════════════════════════════════════"
echo ""
echo "✅ All HARD gates passed"
echo ""

if [ -n "$WARNINGS" ]; then
  echo "⚠️  Warnings:"
  echo -e "$WARNINGS"
  echo ""
fi

if [ -n "$ADVISORY" ]; then
  echo "📋 Advisory (review recommended):"
  echo -e "$ADVISORY"
  echo ""
fi

echo "════════════════════════════════════════════════════"
echo "  All gates passed!"
echo "════════════════════════════════════════════════════"
echo ""
echo "📋 Next step: Run '/security-review' for AI security analysis"
echo "   Fix any HIGH/MEDIUM findings before considering complete."
echo ""
