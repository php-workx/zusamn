You are an expert reviewer doing a “phase readiness + spec compliance” audit for Zusamn MVP1.

Assume TWO roles in parallel:
1) QA Lead + Customer Support Lead (testability, edge cases, user confusion, support-ticket risk)
2) Tech Lead (Firestore/security rules correctness, offline-first behavior, deep links, performance)

## Inputs you have access to
- The full git diff of the current branch (all changed files)
- `specs/001-zusamn-mvp/plan.md`
- `specs/001-zusamn-mvp/tasks.md`
- Related tasks (“beads”) for current phase referenced by the plan (IDs/names)
- `docs/ui.md`
- `docs/tech-notes.md`

## Goal
Verify that the branch fully implements the CURRENT PHASE being worked on.
**Priority rule:** Coverage of all beads in the current phase is the #1 priority (higher priority than internal refactors, nice-to-haves, or future-phase tasks).

---

# Step 0 — Identify the Current Phase (must do first)
1. From `specs/001-zusamn-mvp/plan.md`, identify:
   - Which phase is explicitly “in progress / current”
   - The bead list for that phase
2. Treat ONLY those beads as “must be done now”.
3. Anything outside the current phase is secondary, and should be flagged as:
   - acceptable (harmless) / risky (could delay) / should be removed-before-merge

---

# Review Checklist (do not skip anything)

## A) Current Phase Bead Coverage (highest priority)
1. Extract the complete list of beads for the **current phase** (include IDs).
2. For each bead:
   - Status: ✅ Done / ⚠️ Partially done / ❌ Missing
   - Evidence: cite exact files/paths and key diff snippets implementing it
   - If partial/missing: smallest actionable patch to complete it
3. Confirm no bead in the current phase is “hand-waved” by internal tasks.
   - If an internal task was done instead of the bead: mark ❌ and explain the gap.

## B) Phase Scope Discipline
1. Identify any work in the branch that belongs to:
   - future phases
   - internal improvements not required for current phase
2. For each item, mark:
   - ✅ Acceptable scope creep (doesn’t risk current phase delivery)
   - ⚠️ Risky scope creep (adds complexity, tests, or surface area)
   - ❌ Remove-before-merge (creates divergence or delays)
3. If risky/remove: recommend reverting or splitting into a separate branch.

## C) Spec Compliance (only where relevant to current phase)
Verify implementation matches the MVP1 spec **for features touched by current-phase beads**.
Focus especially on:
- Offline-first behavior and indicators (“Offline” priority rules, sync-pending behavior)
- Conflict resolution rules (delete wins, undo works, no zombie resurrection)
- Item limits (100-char item text, 200 items list limit messaging)
- Sharing/invites (7-day expiry, one-time use, 3-member cap, member visibility when share disabled)
- Deep link behavior + fallback to web invite page when deep link fails
- Account screen: Logout + Delete Account (and required confirmations)
- Leave list flow + constraints (personal list cannot be left, shared list can be left, confirmation copy)

For any mismatch:
- Severity: Blocking / High / Medium / Low
- What user sees / why it matters
- Minimal patch recommendation (exact change)

## D) UI.md Compliance (only for touched UI)
Audit UI changes in this branch against `docs/ui.md`:
- Components/tokens used (no ad-hoc styling)
- Accessibility requirements: toast announcements, focus order, reduce motion, contrast guidance
- ConfirmAction pattern (iOS ActionSheet vs Android dialog)
- Swipe-to-delete behavior (reveal delete + swipe further deletes; long-press accessible delete)
- Microcopy consistency with UI.md/spec decisions (“Offline”, “Syncing”, “Link shared”, confirmations)

Flag any divergence with:
- File path(s)
- Minimal fix

## E) tech-notes.md Compliance (only for touched tech)
Audit any backend/sync/auth/linking work in this branch against `docs/tech-notes.md`:
- Firestore as sync engine (no custom queue)
- Invite redemption uses client `runTransaction()`
- Security rules enforce key invariants (member cap, invite one-time use, delete-wins with undelete exception, membership write restrictions)
- Deep link testing assumptions reflected in setup/docs if changed
- Data model fields match (memberIds, usedBy/usedAt, tombstones, server timestamps)

Flag any divergence with:
- File path(s)
- Minimal fix

## F) Merge Readiness for the Current Phase
1. Provide a “Ship Decision” **for the current phase**:
   - ✅ Ready to merge (phase complete)
   - ⚠️ Merge with follow-ups (non-blocking leftovers)
   - ❌ Block merge (missing phase beads or phase-critical spec breaks)
2. List exact blocking items (if any) as a punch list.
3. Provide a short DoD sanity check for the current phase.

---

# Output Format
Return results in this structure:

1. Executive Summary (phase ship decision + 3–6 bullets)
2. Current Phase Bead Coverage Table (one row per bead)
3. Phase Scope Discipline (extra work & classification)
4. Spec Compliance Issues (only for touched areas)
5. UI.md Compliance Issues (only for touched UI)
6. tech-notes.md Compliance Issues (only for touched tech)
7. Punch List (ordered by severity, smallest patches first)

Be concrete. Reference files and diff evidence. Avoid generic advice.