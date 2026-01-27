# Repo Instructions

- Use conventional commits (feat:, fix:, docs:, etc.).
- Use pnpm + Turborepo for all scripts; do not add Yarn/npm lockfiles.
- Keep TypeScript strict; prefer types in `packages/domain` and reuse across apps/functions.
- No secrets or real Firebase config in code or docs; use env vars and `.env.example` only.
- UI must use Tamagui components and the shared `@zusamn/ui` provider.
- Cloud Functions live in `firebase/functions`; Firestore rules in `firebase/firestore.rules`.

---

## Critical Rules

| Rule                                          | Reason                                     |
|-----------------------------------------------|--------------------------------------------|
| NEVER push to remote                          | User pushes when ready                     |
| NEVER commit to main                          | Always use feature branches                |
| Task = `gate:commit`                          | Automatic via pre-commit hooks             |
| Epic/Phase = `gate:push` + `/security-review` | Manual, thorough checks                    |
| Fix failures immediately                      | Don't leave broken gates for user          |
| Always commit before stopping                 | Don't leave work stranded locally          |
| NEVER change `gate` rules                     | gates protect quality and set expectations |

---

## Workflow: Completing a Task

After finishing a **single beads issue**:

1. **Commit** - Pre-commit hooks run automatically
   ```bash
   git add <files> && git commit -m "feat: ..."
   ```
   - Runs `gate:commit`: secrets scan, typecheck, lint, fast tests
   - Fix any failures before commit succeeds

2. **Close the issue**
   ```bash
   bd close <issue-id>
   ```

3. **Continue** - Pick up next task
   ```bash
   bd ready
   ```

This is **fast (<30s)** and happens after each task.

---

## Workflow: Completing an Epic/Phase

When **ALL tasks** in an epic/phase are done (before user pushes):

### Step 1: Run Full Quality Gates
```bash
pnpm gate:push
```
- Coverage thresholds, full build, secrets, constitution, spec compliance
- **Fix any failures** before proceeding

### Step 2: Run Security Review
```bash
/security-review
```
- AI analyzes diff for security vulnerabilities
- **Fix any HIGH/MEDIUM findings**

### Step 3: Run Code Review
```bash
/review my changes in the current branch
```
- AI analyzes diff and does a code review
- **Fix any relevant findings**

### Step 4: Final Sync
```bash
bd sync --from-main
git status  # Verify all changes committed
```

### Step 5: Hand Off
Summarize for the user:
- What was implemented
- What's ready for push
- Any notes or follow-ups

This is **thorough (~5min)** and happens once per epic/phase.

---

## Issue Tracking with bd (beads)

This project uses **bd (beads)** for ALL issue tracking.

```bash
bd ready              # Find unblocked work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync --from-main   # Sync with main branch
```

For more details, see `docs/beads.md`.
