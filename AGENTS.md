# Repo Instructions

- Use pnpm + Turborepo for all scripts; do not add Yarn/npm lockfiles.
- Keep TypeScript strict; prefer types in `packages/domain` and reuse across apps/functions.
- No secrets or real Firebase config in code or docs; use env vars and `.env.example` only.
- UI must use Tamagui components and the shared `@zusamn/ui` provider.
- Cloud Functions live in `firebase/functions`; Firestore rules in `firebase/firestore.rules`.
- Run `pnpm lint` and `pnpm typecheck` before finalizing changes.
