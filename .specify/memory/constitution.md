<!-- Sync Impact Report
Version change: TEMPLATE -> 1.0.0
Modified principles:
- Placeholder Principle 1 -> I. Code Quality & Type Safety
- Placeholder Principle 2 -> II. Test-Backed Changes
- Placeholder Principle 3 -> III. UX Consistency via Tamagui
- Placeholder Principle 4 -> IV. Performance Budgets
- Placeholder Principle 5 -> V. Configuration & Platform Hygiene
Added sections: Platform Constraints; Workflow & Quality Gates
Removed sections: None
Templates requiring updates: ✅ .specify/templates/plan-template.md; ✅ .specify/templates/spec-template.md;
✅ .specify/templates/tasks-template.md; ⚠ .specify/templates/commands/*.md (directory not present)
Follow-up TODOs: TODO(RATIFICATION_DATE): original adoption date unknown
-->
# Zusamn Monorepo Constitution

## Core Principles

### I. Code Quality & Type Safety
All TypeScript must remain strict. New types belong in `packages/domain` and
must be reused across apps and functions instead of duplicating models. Linting
and typechecking must pass for every change.
Rationale: a shared, strict type system prevents drift and avoids runtime defects.

### II. Test-Backed Changes
Every behavior change must include automated tests that fail without the change
and pass with it. Unit tests cover domain logic; integration tests cover app or
function flows that cross module boundaries. Bug fixes must include regression
coverage.
Rationale: tests are the primary safeguard for reliability and future refactors.

### III. UX Consistency via Tamagui
All UI must use Tamagui components and the shared `@zusamn/ui` provider. Visual
tokens, spacing, typography, and interaction patterns must remain consistent
across apps; deviations require an explicit decision and shared token updates.
Rationale: consistent UI reduces user friction and keeps maintenance predictable.

### IV. Performance Budgets
Each feature must define performance targets (load, interaction, and backend
latency where applicable) in the plan/spec and verify they are met before
shipping. Changes must not regress established performance baselines.
Rationale: performance is a product requirement and must be managed explicitly.

### V. Configuration & Platform Hygiene
No secrets or real Firebase config may be committed. Use environment variables
and maintain `.env.example`. Firebase Cloud Functions live in
`firebase/functions`, and Firestore rules live in `firebase/firestore.rules`.
Use pnpm + Turborepo for all scripts and do not add Yarn/npm lockfiles.
Rationale: predictable structure and safe configuration reduce operational risk.

## Platform Constraints

- Use pnpm + Turborepo for all scripts; do not add Yarn/npm lockfiles.
- Keep TypeScript strict; prefer types in `packages/domain` and reuse across
  apps/functions.
- No secrets or real Firebase config in code or docs; use env vars and
  `.env.example` only.
- UI must use Tamagui components and the shared `@zusamn/ui` provider.
- Cloud Functions live in `firebase/functions`; Firestore rules in
  `firebase/firestore.rules`.

## Workflow & Quality Gates

- `pnpm lint` and `pnpm typecheck` must pass before merge or release.
- Tests required by Principle II must run and pass before merge.
- Performance targets must be declared in the plan/spec and validated before
  release.
- UX changes must use shared components and tokens; any new patterns must be
  reviewed for cross-app consistency.
- New environment variables must be added to `.env.example` and documented in
  the relevant README or spec.

## Governance

- This constitution supersedes all other local practices and templates.
- Amendments require a PR that updates this document, includes rationale, and
  documents migration or roll-out impact.
- Versioning follows Semantic Versioning: MAJOR for breaking governance changes,
  MINOR for new principles or material expansions, PATCH for clarifications.
- Every spec/plan must include a Constitution Check; reviewers must block
  non-compliant changes unless an explicit, time-boxed exception is documented
  with owner, rationale, and rollback plan.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date unknown | **Last Amended**: 2026-01-23
