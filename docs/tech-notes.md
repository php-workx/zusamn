# Tech Notes — MVP1 (Engineering Notes, Not Product Scope)
**Last updated:** 2026-01-25  
**Purpose:** Capture implementation risks, mitigations, and engineering decisions implied by the MVP1 product spec.  
**Rule:** This document must NOT expand product scope. It exists to reduce delivery risk and inform planning.

---

## 0) Key MVP1 Decisions (Confirmed)
- **Sync engine:** Firestore (standard SDK behavior). **No custom offline queue / no custom sync engine.**
- **Invite redemption:** Client-side **Firestore `runTransaction()`** in MVP1.
- **Delete-wins enforcement:** Firestore **Security Rules reject edits to deleted items** (with a narrow exception for Undo/Undelete).
- **Deep linking:** Yes — invite links must open the app when installed, and fall back to the web invite page when not.

---

## 1) Scope Reminder (MVP1)
- Mobile apps only (iOS + Android), **no web app** beyond the minimal **web invite accept page** (Option B).
- Auth: Apple + Google.
- Offline-first + near-instant sync when online.
- Invites: one-time use, expire after 7 days.
- Small groups: max 3 members per list.
- Alias-first list naming and per-user alias rename.

---

## 2) Base Technology Stack (MVP1)
> Record long-term choices here so planning doesn’t guess.

### 2.1 Client (Mobile)
- **Expo + Development Builds (EAS):** required for deep links + native auth + Firebase native modules testing.
- **React Native + TypeScript**
- **UI:** Tamagui (as per UI.md)
- **Gestures & animation:** `react-native-gesture-handler` + `react-native-reanimated` (swipe-to-delete, sink animation)
- **Local key/value:** **MMKV** for small local state that must persist across auth/app restarts (e.g., pending invite token to process after login), settings.

### 2.2 Backend
- **Firebase Auth** (Google + Apple)
- **Firestore** (realtime listeners + offline persistence handled by the SDK)
- **Minimal web invite accept page:** Firebase Hosting (or equivalent) + Firebase Auth web SDK + Firestore (for invite redemption).
- **Cloud Functions:** optional (post-MVP), NOT required for MVP1 invite redemption.

---

## 3) Non-Negotiable Invariants (Must Always Hold)
1. **Membership cap:** A list must never exceed **3 members**.
2. **Invite singularity:** An invite can be redeemed **exactly once**.
3. **Access control:** Only members can read/write list data.
4. **Delete dominance:** If an item is deleted on the server (`deleted: true`), **no late offline edit may resurrect it**.
5. **Undo safety:** Undo/Undelete is allowed (within UX constraints) without opening zombie-resurrection bugs.
6. **Soft deletes only:** Items are never hard-deleted in MVP1.

---

## 4) Firestore Data Model (MVP1)
> Security Rules and queries depend on this. Don’t let engineers invent schemas.

### 4.1 Users
`/users/{userId}`
- `displayName: string`
- `email: string` (from auth; not user-editable)
- `avatarUrl: string | null`
- `locale: "de" | "en"`
- `createdAt: timestamp (server)`
- `deletedAt: timestamp | null` (account deletion marker; see §11)

### 4.2 Lists
`/lists/{listId}`
- `ownerUserId: string` (creator; analytics + potential cleanup; **not used for permissions**)
- `memberIds: string[]` (**required**; max 3 — used by Security Rules)
- `createdAt: timestamp (server)`
- `itemCount: number` (optional; maintained by client transactions)

### 4.3 Memberships (alias per user)
`/lists/{listId}/memberships/{userId}`
- `alias: string` (max 50)
- `joinedAt: timestamp (server)`

### 4.4 Items (soft delete / tombstone)
`/lists/{listId}/items/{itemId}`
- `text: string` (max 100)
- `checked: boolean`
- `deleted: boolean` (tombstone)
- `createdByUserId: string`
- `serverCreatedAt: timestamp (server)`
- `serverUpdatedAt: timestamp (server)` (update on any change incl. delete/undelete)
- `deletedByUserId: string | null` (optional; can be added without scope impact)

### 4.5 Invites (global collection)
`/invites/{inviteId}`
- `listId: string`
- `inviteAlias: string` (max 50)
- `createdByUserId: string`
- `createdAt: timestamp (server)`
- `expiresAt: timestamp`
- `usedBy: string | null` (**required**)
- `usedAt: timestamp | null` (**required**)

**Key decisions:**
- `memberIds` must live on the list doc (not only as a subcollection) to enforce the 3-member cap in Rules.
- Items are **soft deleted** via `deleted=true`.
- `serverUpdatedAt` is the authoritative time for conflict ordering.

---

## 5) Firestore Security Rules (MVP1 Pseudocode)
> Rules enforce access + invariants where feasible. Keep rules simple and aligned with the data model.

```
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {

function isAuthenticated() {
  return request.auth != null;
}

function isMember(listId) {
  return isAuthenticated() &&
    request.auth.uid in get(/databases/$(database)/documents/lists/$(listId)).data.memberIds;
}

// --- USERS ---
match /users/{userId} {
  allow read, write: if isAuthenticated() && request.auth.uid == userId;
}

// --- LISTS ---
match /lists/{listId} {
  allow read: if isMember(listId);

  // Create: user creates list with themselves as the only member
  allow create: if isAuthenticated() &&
    request.resource.data.memberIds.size() == 1 &&
    request.resource.data.memberIds[0] == request.auth.uid;

  // Update: any member may update (equal permissions), but enforce cap
  allow update: if isMember(listId) &&
    request.resource.data.memberIds.size() <= 3;

  // No delete (lists persist; leaving is membership removal)
  allow delete: if false;

  // --- MEMBERSHIPS ---
  match /memberships/{userId} {
    allow read: if isMember(listId);

    // Only the user may write their membership doc (alias)
    allow write: if isAuthenticated() && request.auth.uid == userId && isMember(listId);

    // Leaving list implemented by deleting own membership doc
    allow delete: if isAuthenticated() && request.auth.uid == userId && isMember(listId);
  }

  // --- ITEMS ---
  match /items/{itemId} {
    allow read: if isMember(listId);

    // Create: member, enforce text length
    allow create: if isMember(listId) &&
      request.resource.data.text.size() <= 100;

    // Update: member, but block zombie edits to deleted items
    // Exception: allow undelete/undo (deleted:true -> deleted:false)
    allow update: if isMember(listId) && (
      (resource.data.deleted == false) ||
      (resource.data.deleted == true && request.resource.data.deleted == false)
    );

    // No hard deletes in MVP1
    allow delete: if false;
  }
}

// --- INVITES ---
match /invites/{inviteId} {
  // MVP1: require auth to read invite validity (aligns with web accept flow).
  allow read: if isAuthenticated();

  allow create: if isAuthenticated() &&
    request.resource.data.createdByUserId == request.auth.uid;

  // Claiming invite: only if unused + unexpired + user claims for self
  allow update: if isAuthenticated() &&
    resource.data.usedBy == null &&
    resource.data.expiresAt > request.time &&
    request.resource.data.usedBy == request.auth.uid;
}
//   }
// }
```

**Notes**
- The 3-member cap is enforced on `/lists/{listId}.memberIds`.
- The “delete wins” invariant is enforced by rejecting updates to deleted items (except undelete).
- Rules alone cannot reliably enforce the **200-item limit** (counting is expensive/impossible in rules). MVP1 keeps this client-enforced; see §8.

---

## 6) Offline + Sync Strategy (Standard Firestore SDK)
### 6.1 Decision
- **Do NOT build a custom operation queue** in MVP1.
- **Trust Firestore offline persistence + sync engine**:
  - Client writes directly to Firestore documents.
  - SDK queues offline writes and syncs them on reconnect.
  - Realtime listeners deliver remote changes.

### 6.2 Pending / Sync UI signals
- Use Firestore snapshot metadata (e.g., `snapshot.metadata.hasPendingWrites`) + connectivity state:
  - **Offline** shown when no connectivity.
  - **Sync pending / Syncing** shown when online AND pending writes exist.

### 6.3 Conflict resolution (MVP1)
- Edit vs Edit: **Last write wins** using **server timestamps** (`serverUpdatedAt`).
- Edit vs Delete: **Delete wins** because Rules reject late edits to deleted docs.
- Delete vs Check: Delete wins (same mechanism).

### 6.4 Undo semantics (must work even if delete already synced)
- **If delete is still pending (offline or not yet acknowledged):** Undo cancels locally; deletion is not sent.
- **If delete already synced:** Undo performs an **undelete** write: `deleted=false`, updates `serverUpdatedAt`.
- MVP1 simplification: no strict server-side 5s restriction on undelete (UX still shows 5s toast). Post-MVP can restrict.

### 6.5 “While typing” remote-change deferral (UI-layer)
- While add-item input has focus:
  - Buffer remote UI effects (highlights + sink animations).
  - Do not reorder list visually.
- On blur or submit:
  - Apply buffered UI effects.

---

## 7) Invite Redemption Atomicity (Client Transaction)
**Why**
- Client-side checks like `members.length < 3` are unsafe (race conditions).
- Transaction must atomically:
  - enforce member cap
  - ensure invite is one-time
  - create membership + add member

**Transaction steps (`runTransaction`)**
1. Read `/invites/{inviteId}`:
   - `usedBy == null`
   - `expiresAt > now`
2. Read `/lists/{listId}`:
   - `memberIds.length < 3`
3. Write invite:
   - set `usedBy = myUid`, `usedAt = now`
4. Write list:
   - update `memberIds` to include `myUid` (arrayUnion)
5. Write membership doc:
   - `/lists/{listId}/memberships/{myUid}` with `alias`, `joinedAt`

**Retry**
- Retry transaction up to **3 times** on contention.
- If still failing: show “Something went wrong. Please try again.”

---

## 8) Limits & Enforcement Notes (200 Items, 3 Members)
### 8.1 Member limit (3)
- **Server-enforced** via rules on `memberIds.size() <= 3` + transaction.

### 8.2 Item limit (200)
- MVP1: **client-enforced only** (rules cannot count cheaply).
- Implementation:
  - Maintain `itemCount` on list docs and enforce in client transactions.
  - Block creating item if count >= 200.
  - Error UI message: “List full (200 items). Clear checked items to add more.”

**Post-MVP options**
- Or accept occasional over-limit and reconcile.

---

## 9) Deep Links & Testing Approach (What this means)
### 9.1 Yes, we “do deep linking”
- Invite links are HTTPS links that should:
  - open the app directly when installed (Universal Links / Android App Links)
  - otherwise open the web invite accept page (Option B)

### 9.2 Why “Expo Go won’t work” matters
- **Expo Go** does not reliably support:
  - Universal/App Links
  - native auth redirect edge cases
  - some Apple Sign-In behavior
- If you try to test these in Expo Go, you’ll waste days chasing “broken” links that are actually “wrong test environment”.

### 9.3 MVP1 testing requirement
- Use **Development Builds (EAS)** from day 1 for:
  - deep links
  - Apple/Google auth redirect flows
  - invite acceptance routing
- Configure early:
  - `scheme: "zusamn"` (e.g., `zusamn://`)
  - `associatedDomains` (iOS) + `assetlinks.json` (Android)
  - AASA file deployment + verification

### 9.4 Fallback behavior (required)
- If app link open fails:
  - Fall back to web invite page
  - Show “Open in App” + “Install app” CTAs

---

## 10) Firestore Index Requirements (MVP1)
Create composite indexes for expected item queries:

1) List detail query (exclude deleted, unchecked first, newest first)
- Collection: `lists/{listId}/items`
- Query: `where(deleted==false).orderBy(checked asc).orderBy(serverCreatedAt desc)`
- Index: `deleted ASC, checked ASC, serverCreatedAt DESC`

2) Optional maintenance query (recent updates, debug)
- Collection: `lists/{listId}/items`
- Query: `where(deleted==false).orderBy(serverUpdatedAt desc)`
- Index: `deleted ASC, serverUpdatedAt DESC`

**Note:** Deploy indexes before launch; queries fail without them.

---

## 11) App Lifecycle Sync Behavior (Mobile)
**Backgrounding**
- iOS suspends quickly; listener disconnects when app is suspended.
- Data may be stale on resume.

**Foreground resume**
- On `AppState` -> `active`:
  1. Re-establish listeners (automatic)
  2. Allow SDK to flush pending writes
  3. Apply buffered UI effects if any
- If resync takes > 1s: show subtle “Syncing” state (per UI.md).

**Engineering tasks**
- Test resume after: 1 min, 5 min, 1 hour.

---

## 12) Performance & Cost Notes (MVP1)
### 12.1 200 items rendering
- Use `FlatList`, stable `keyExtractor`, `memo()` ListRow, avoid inline callbacks.
- Keep derived arrays (unchecked/checked) stable; avoid full resort on minor changes.

### 12.2 Firestore read costs
- Opening a list reads up to ~200 docs on initial sync and reconnect.
- With the 200-item cap, this is acceptable for MVP1; monitor post-launch.

---

## 13) Observability (Minimal, Still Worth It)
- Invite redemption outcomes: success / expired / used / full / already-member / error.
- Sync error rate (listener errors, transaction failures).
- Pending writes indicator flapping frequency (UX quality signal).

---

## 14) “Do Not Do” List (MVP1)
- **Don’t build a custom Redux/offline operation queue.** Trust Firestore + Rules.
- Don’t rely on device clock for conflict resolution.
- Don’t hard-delete items (use tombstones).
- Don’t enforce 200-item limit in Security Rules in MVP1 (counting is costly/impractical).
- Don’t debug deep links in Expo Go — use Development Builds.
- Don’t expand web beyond invite acceptance.
