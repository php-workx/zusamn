# Research: Zusamn MVP1 Architecture

**Status**: Consolidated
**Input**: `docs/tech-notes.md`, `specs/001-zusamn-mvp/spec.md`

## 1. Sync & Offline Strategy
**Decision**: Use Standard Firestore SDK (Offline Persistence)
**Rationale**:
- **Speed**: Zusamn needs a "calm" offline-first experience. Firestore's SDK handles local caching, queueing, and optimistic updates out of the box.
- **Complexity**: Building a custom operation queue (Redux-offline, etc.) introduces significant risk and maintenance overhead for conflict resolution.
- **Constraint Compliance**: Meets the "Offline-First" constitution principle without custom engineering.
**Alternatives Considered**:
- **Custom Sync Queue (SQL + REST)**: Rejected. Too complex for MVP.
- **Local-first (CRDTs like Yjs/Automerge)**: Rejected. Overkill for simple lists; complicates backend auth/storage logic for MVP.

## 2. Authentication & Invites
**Decision**: Firebase Auth + Custom "Invite" Collection + Transaction
**Rationale**:
- **Security**: Invites must be one-time use and enforce a 3-member limit. Client-side checks are unsafe.
- **Implementation**: A Firestore `runTransaction` can atomically check the limit, mark the invite as used, and add the member.
- **Deep Links**: Using Firebase Hosting + Universal Links allows a unified "web fallback" flow (Option B in spec).
**Alternatives Considered**:
- **Cloud Functions for Invite Redemption**: Rejected for MVP. Increases latency and deployment complexity. Transaction is sufficient.

## 3. Tech Stack
**Decisions**:
- **Mobile**: React Native + Expo (Dev Builds). Rationale: Deep link testing requires native builds; Expo simplifies cross-platform.
- **UI**: Tamagui. Rationale: Consistent design tokens, performance, cross-platform.
- **State**: React Context + Firestore Listeners. Rationale: Simple binding; no complex global state manager needed for MVP.
- **Local Config**: MMKV. Rationale: Fast synchronous storage for settings/flags.

## 4. Risks & Mitigations
- **Risk**: 200-item limit performance.
  - **Mitigation**: `FlatList` optimization, memoized rows.
- **Risk**: Deep link configuration hell.
  - **Mitigation**: Use EAS Build immediately; do not use Expo Go.
- **Risk**: "Zombie" items (deleted items reappearing).
  - **Mitigation**: "Delete wins" rule enforced by Security Rules (rejecting updates to `deleted: true` docs).

## 5. Unknowns Resolved
- **Q**: How to handle web invites without a web app?
  - **A**: Minimal static page on Firebase Hosting using Firebase Auth JS SDK.
- **Q**: How to enforce limits?
  - **A**: Member limit (3) via Security Rules. Item limit (200) via Client-side check (Soft enforcement acceptable for MVP).
