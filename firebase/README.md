# Firebase

## Setup
- Create a Firebase project and add iOS/Android/Web apps.
- Copy config values into `.env` (see `.env.example`).

## Firestore Rules
- Rules live in `firebase/firestore.rules`.
- Deploy with `firebase deploy --only firestore:rules`.

## Cloud Functions
- Source: `firebase/functions/src` (TypeScript)
- Build: `pnpm --filter @zusamn/functions build`
- Deploy: `firebase deploy --only functions`

## Emulators
```bash
firebase emulators:start --only firestore,auth,functions
```
