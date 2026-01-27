#!/bin/bash
# Scan for secrets and sensitive data in the repository
# Requires gitleaks to be installed locally

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR"

echo "Scanning for secrets..."

# Require gitleaks
if ! command -v gitleaks &> /dev/null; then
  echo ""
  echo "❌ gitleaks is required but not installed"
  echo ""
  echo "   Install with: brew install gitleaks"
  echo "   Or see: https://github.com/gitleaks/gitleaks#installing"
  exit 1
fi

# Full repository scan (more thorough than --staged)
echo "  Using gitleaks..."
if ! gitleaks detect --source . --redact --no-banner; then
  echo ""
  echo "❌ Secrets detected!"
  echo ""
  echo "   Remove the secret and use environment variables instead."
  echo "   If this is a false positive, add to .gitleaks.toml allowlist."
  exit 1
fi

echo "  ✓ No secrets found"
