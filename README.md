# Zusamn Monorepo

## Stack
- Turborepo + pnpm workspaces
- Expo (mobile + web)
- Tamagui UI
- Firebase (Auth + Firestore + Cloud Functions)

## Dev
```bash
pnpm i
pnpm lint
pnpm typecheck
```

Prereqs: Node 22, pnpm 10.27.0+

### Run apps
```bash
# Mobile (iOS/Android)
pnpm --filter @zusamn/mobile start

# Web
pnpm --filter @zusamn/web start
```

## Firebase
See `firebase/README.md` for local emulators and deployment notes.
