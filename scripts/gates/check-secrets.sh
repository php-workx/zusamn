#!/bin/bash
# Scan for secrets and sensitive data in staged/committed files
# Uses gitleaks if available, falls back to pattern matching

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR"

echo "Scanning for secrets..."

# Create a temporary exclude file for scanners
EXCLUDE_FILE=$(mktemp)
cat > "$EXCLUDE_FILE" << 'EOF'
node_modules/
coverage/
dist/
build/
.expo/
*.lock
pnpm-lock.yaml
package-lock.json
*.png
*.jpg
*.ico
*.woff
*.woff2
*.ttf
EOF

# Try gitleaks first (preferred - it's faster and more accurate)
if command -v gitleaks &> /dev/null; then
  echo "  Using gitleaks..."
  # Use git-aware scanning (only scans tracked files, respects .gitignore)
  GITLEAKS_OUTPUT=$(gitleaks detect --source . --redact 2>&1) || true

  if echo "$GITLEAKS_OUTPUT" | grep -q "leaks found"; then
    echo "❌ Secrets detected by gitleaks!"
    echo "$GITLEAKS_OUTPUT"
    rm -f "$EXCLUDE_FILE"
    exit 1
  fi
  echo "  ✓ gitleaks: clean"
  rm -f "$EXCLUDE_FILE"
  exit 0
fi

# Try trufflehog as alternative (exclude node_modules)
if command -v trufflehog &> /dev/null; then
  echo "  Using trufflehog..."
  # Only scan git-tracked files, exclude node_modules and other non-source dirs
  TRUFFLEHOG_OUTPUT=$(trufflehog filesystem . --no-update --exclude-paths "$EXCLUDE_FILE" 2>&1) || true

  # Check for findings (but filter out common false positives)
  if echo "$TRUFFLEHOG_OUTPUT" | grep -v "example.com\|localhost\|127.0.0.1" | grep -q "Found.*result"; then
    echo "❌ Secrets detected by trufflehog!"
    echo "$TRUFFLEHOG_OUTPUT" | grep -v "example.com\|localhost\|127.0.0.1" | head -30
    rm -f "$EXCLUDE_FILE"
    exit 1
  fi
  echo "  ✓ trufflehog: clean"
  rm -f "$EXCLUDE_FILE"
  exit 0
fi

rm -f "$EXCLUDE_FILE"

# Fallback: basic pattern matching (only on git-tracked source files)
echo "  ⚠️  No secret scanner found (install gitleaks: brew install gitleaks)"
echo "  Using basic pattern matching..."

# Patterns to search for (case insensitive)
PATTERNS=(
  "AKIA[0-9A-Z]{16}"                      # AWS Access Key
  "AIza[0-9A-Za-z_-]{35}"                 # Google API Key
  "sk-[a-zA-Z0-9]{48}"                    # OpenAI API Key
  "sk_live_[a-zA-Z0-9]{24,}"              # Stripe Live Key
  "ghp_[a-zA-Z0-9]{36}"                   # GitHub Personal Access Token
  "gho_[a-zA-Z0-9]{36}"                   # GitHub OAuth Token
  "glpat-[a-zA-Z0-9_-]{20}"               # GitLab Personal Access Token
  "xox[baprs]-[0-9]{10,13}-[a-zA-Z0-9-]+" # Slack Token
  "-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----" # Private Keys
)

# Get git-tracked source files only (excludes node_modules automatically)
FILES_TO_CHECK=$(git ls-files -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.json' '*.yaml' '*.yml' '*.env*' 2>/dev/null || true)

FOUND_SECRETS=0

for pattern in "${PATTERNS[@]}"; do
  if [ -n "$FILES_TO_CHECK" ]; then
    MATCHES=$(echo "$FILES_TO_CHECK" | xargs grep -lE "$pattern" 2>/dev/null || true)
    if [ -n "$MATCHES" ]; then
      echo "❌ Potential secret matching pattern: $pattern"
      echo "   In files: $MATCHES"
      FOUND_SECRETS=1
    fi
  fi
done

# Check for .env files that shouldn't be committed (but allow .env.example)
ENV_FILES=$(git ls-files | grep -E "^\.env$|^\.env\.(local|development|production)$" | grep -v "example" || true)
if [ -n "$ENV_FILES" ]; then
  echo "❌ Environment files should not be committed: $ENV_FILES"
  FOUND_SECRETS=1
fi

if [ $FOUND_SECRETS -eq 1 ]; then
  echo ""
  echo "Review the files above and remove any secrets."
  echo "Consider using environment variables or a secrets manager."
  exit 1
fi

echo "  ✓ Basic pattern scan: clean"
echo "  💡 Install gitleaks for better detection: brew install gitleaks"
