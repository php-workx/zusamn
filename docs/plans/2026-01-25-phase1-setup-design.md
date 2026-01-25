# Phase 1 Setup Design

**Date**: 2026-01-25
**Scope**: Phase 1 setup tasks (zusamn-s3d.1.1–1.5) + pre-commit hooks (zusamn-a45)

## Goals
- Audit and align the existing monorepo structure with the MVP spec.
- Configure Expo/EAS, Firebase scaffolding, and Tamagui tokens.
- Add pre-commit hooks to enforce lint/typecheck/test via Turbo.

## Key Decisions
- **Audit + align** instead of re-initializing from scratch.
- **Use `apps/web` as the invite landing app** (no new `apps/web-invite`).
- **Domain**: `zusamn.com` for invites and deep links.
- **Bundle IDs**: `com.zusamn.app` for both iOS and Android.
- **Secrets policy**: No real Firebase config committed. Use `.env.example` + placeholder `.example` config files and documentation.

## Implementation Notes
- Update docs/spec references where necessary to reflect `apps/web` usage.
- Add `apps/mobile/eas.json` with dev-client profiles.
- Extend `apps/mobile/app.json` with bundle IDs and associated domains/app links.
- Add placeholder `apps/mobile/google-services.json.example` and `apps/mobile/GoogleService-Info.plist.example`.
- Align Tamagui tokens in `packages/ui/src/tamagui.config.ts` to `docs/ui.md` values.
- Add `.pre-commit-config.yaml` with local hooks for `pnpm turbo lint`, `pnpm turbo typecheck`, and `pnpm turbo test`.

## Verification
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test` at the end of the session.
- For code changes (e.g., token config), add minimal tests to confirm expected values.
