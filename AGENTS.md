# Repo Instructions

- Use conventional commits (feat:, fix:, docs:, etc.).
- Use pnpm + Turborepo for all scripts; do not add Yarn/npm lockfiles.
- Keep TypeScript strict; prefer types in `packages/domain` and reuse across apps/functions.
- No secrets or real Firebase config in code or docs; use env vars and `.env.example` only.
- UI must use Tamagui components and the shared `@zusamn/ui` provider.
- Cloud Functions live in `firebase/functions`; Firestore rules in `firebase/firestore.rules`.
## Quality Gates

Before finalizing any work, run:

```bash
pnpm gate:commit    # Fast checks (typecheck, lint, tests, secrets)
pnpm gate:push      # Full checks (coverage, build, secrets, constitution, spec)
```

**CRITICAL**: Agents MUST run `pnpm gate:push` and fix ALL issues before considering work complete. Do NOT leave failing gates for the user to fix.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below.

**MANDATORY WORKFLOW:**

1. **Run quality gates** - `pnpm gate:push` must pass with no errors
2. **Fix any issues** - If gates fail, fix and re-run until they pass
3. **File issues for remaining work** - Create issues for anything that needs follow-up
4. **Update issue status** - Close finished work, update in-progress items
5. **Commit changes** - All changes must be committed locally
6. **Sync beads** - `bd sync --from-main` (for ephemeral branches)
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- NEVER push to remote - the user will push when ready
- NEVER commit directly to main
- ALL pre-commit hooks MUST pass before committing
- ALL gate:push checks MUST pass before considering work complete
- Work is NOT complete until gates pass AND changes are committed
- NEVER stop before committing - that leaves work stranded locally
- NEVER say "ready to commit when you are" - YOU must commit
- If gates or commits fail, resolve and retry until they succeed

Use 'bd' for task tracking.

<!-- BEGIN BEADS INTEGRATION -->
## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Auto-syncs to JSONL for version control
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**

```bash
bd ready --json
```

**Create new issues:**

```bash
bd create "Issue title" --description="Detailed context" -t bug|feature|task -p 0-4 --json
bd create "Issue title" --description="What this issue is about" -p 1 --deps discovered-from:bd-123 --json
```

**Claim and update:**

```bash
bd update bd-42 --status in_progress --json
bd update bd-42 --priority 1 --json
```

**Complete work:**

```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task**: `bd update <id> --status in_progress`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" --description="Details about what was found" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`

### Auto-Sync

bd automatically syncs with git:

- Exports to `.beads/issues.jsonl` after changes (5s debounce)
- Imports from JSONL when newer (e.g., after `git pull`)
- No manual export/import needed!

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems

For more details, see README.md and docs/QUICKSTART.md.

<!-- END BEADS INTEGRATION -->
