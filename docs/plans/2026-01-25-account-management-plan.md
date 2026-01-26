# Account Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Account screen with logout and delete account flows, using a client-side Firestore batch and offline guard.

**Architecture:** UI lives in the mobile Account tab and calls Firebase client services. Delete account is a client-side batch: delete memberships, remove memberIds, soft-delete personal list, delete user doc, then sign out.

**Tech Stack:** Expo (React Native), Tamagui via `@zusamn/ui`, Firebase JS SDK (Firestore/Auth), Jest for mobile, Vitest for Firebase package.

---

## Task 1: Add Account Screen UI Tests (render + buttons)

**Files:**
- Create/Modify: `apps/mobile/src/__tests__/account-screen.test.tsx`

### Step 1: Write failing test

```tsx
it('renders display name and action buttons', () => {
  // render AccountScreen with a mocked auth context
  // expect display name text and Logout/Delete Account buttons
});
```

### Step 2: Run test to verify it fails

Run: `pnpm --filter @zusamn/mobile test -- account-screen.test.tsx`
Expected: FAIL (Account screen missing required UI).

### Step 3: Write minimal implementation

Implementation will come in Task 2.

### Step 4: Run test to verify it passes

Run: `pnpm --filter @zusamn/mobile test -- account-screen.test.tsx`
Expected: PASS.

### Step 5: Commit

```bash
git add apps/mobile/src/__tests__/account-screen.test.tsx
# plus any UI changes from Task 2
git commit -m "test: add account screen render tests"
```

---

## Task 2: Implement Account Screen Layout (display name + buttons)

**Files:**
- Modify: `apps/mobile/app/(tabs)/account.tsx`

### Step 1: Write failing test

Reuse Task 1 test (should already fail).

### Step 2: Run test to verify it fails

Run: `pnpm --filter @zusamn/mobile test -- account-screen.test.tsx`
Expected: FAIL until UI is updated.

### Step 3: Write minimal implementation

- Use Tamagui components from `@zusamn/ui`.
- Show display name from `useAuthContext()`.
- Render Logout + Delete Account buttons.

### Step 4: Run test to verify it passes

Run: `pnpm --filter @zusamn/mobile test -- account-screen.test.tsx`
Expected: PASS.

### Step 5: Commit

```bash
git add apps/mobile/app/(tabs)/account.tsx
# plus any test updates from Task 1
 git commit -m "feat: add account screen layout"
```

---

## Task 3: Logout Flow (T111)

**Files:**
- Modify: `apps/mobile/src/__tests__/account-screen.test.tsx`
- Modify: `apps/mobile/app/(tabs)/account.tsx`

### Step 1: Write failing test

```tsx
it('calls signOut when Logout is pressed', async () => {
  // mock signOut from auth context
  // press Logout
  // expect signOut to have been called
});
```

### Step 2: Run test to verify it fails

Run: `pnpm --filter @zusamn/mobile test -- account-screen.test.tsx`
Expected: FAIL (no handler).

### Step 3: Write minimal implementation

- Wire Logout button to `signOut()` from `useAuthContext()`.

### Step 4: Run test to verify it passes

Run: `pnpm --filter @zusamn/mobile test -- account-screen.test.tsx`
Expected: PASS.

### Step 5: Commit

```bash
git add apps/mobile/app/(tabs)/account.tsx apps/mobile/src/__tests__/account-screen.test.tsx
git commit -m "feat: add logout action on account screen"
```

---

## Task 4: Delete Account Service (T112)

**Files:**
- Create: `packages/firebase/src/services/accountService.ts`
- Modify: `packages/firebase/src/index.ts`
- Create/Modify: `packages/firebase/tests/accountService.test.ts`

### Step 1: Write failing test

```ts
it('deletes memberships, removes memberIds, soft-deletes personal list, deletes user doc, and signs out', async () => {
  // set up test data in emulator
  // call deleteAccount(userId)
  // assert membership docs deleted
  // assert list memberIds updated
  // assert personal list marked deleted
  // assert user doc deleted
});
```

### Step 2: Run test to verify it fails

Run: `pnpm --filter @zusamn/firebase test -- accountService.test.ts`
Expected: FAIL (service missing).

### Step 3: Write minimal implementation

- Use Firestore `collectionGroup('memberships')` query by `userId`.
- Batch deletes for membership docs.
- Batch update list docs with `arrayRemove(userId)`.
- Soft-delete the personal list (set `deleted: true`, matching list model).
- Delete `users/{userId}` and sign out.

### Step 4: Run test to verify it passes

Run: `pnpm --filter @zusamn/firebase test -- accountService.test.ts`
Expected: PASS.

### Step 5: Commit

```bash
git add packages/firebase/src/services/accountService.ts packages/firebase/src/index.ts packages/firebase/tests/accountService.test.ts
git commit -m "feat: add delete account service"
```

---

## Task 5: Firestore Rules for Membership Deletion + Query

**Files:**
- Modify: `firebase/firestore.rules`
- Modify: `packages/firebase/tests/rules.test.ts`

### Step 1: Write failing test

Add tests for:
- user can read their membership docs via collection group query
- user can delete their own membership

### Step 2: Run test to verify it fails

Run: `pnpm --filter @zusamn/firebase test -- rules.test.ts`
Expected: FAIL until rules are updated.

### Step 3: Write minimal implementation

- Add collection group match for memberships with userId constraints.
- Allow delete for the authenticated user on their membership doc.

### Step 4: Run test to verify it passes

Run: `pnpm --filter @zusamn/firebase test -- rules.test.ts`
Expected: PASS.

### Step 5: Commit

```bash
git add firebase/firestore.rules packages/firebase/tests/rules.test.ts
git commit -m "feat: allow membership query/delete for account removal"
```

---

## Task 6: Delete Account UI Flow (T113–T116)

**Files:**
- Modify: `apps/mobile/src/__tests__/account-screen.test.tsx`
- Modify: `apps/mobile/app/(tabs)/account.tsx`
- Add dependency if needed: `@react-native-community/netinfo`

### Step 1: Write failing tests

```tsx
it('blocks delete account when offline', async () => {
  // mock NetInfo to offline
  // press Delete Account and expect error message
});

it('confirms and calls deleteAccount when online', async () => {
  // mock NetInfo to online, mock deleteAccount
  // open confirm dialog and confirm
  // expect deleteAccount called
});
```

### Step 2: Run test to verify it fails

Run: `pnpm --filter @zusamn/mobile test -- account-screen.test.tsx`
Expected: FAIL.

### Step 3: Write minimal implementation

- Use NetInfo to guard deletion.
- Show ConfirmDialog with warning text.
- Call `deleteAccount` from `@zusamn/firebase`.
- Disable Delete button while processing.

### Step 4: Run test to verify it passes

Run: `pnpm --filter @zusamn/mobile test -- account-screen.test.tsx`
Expected: PASS.

### Step 5: Commit

```bash
git add apps/mobile/app/(tabs)/account.tsx apps/mobile/src/__tests__/account-screen.test.tsx
git commit -m "feat: wire delete account flow"
```

---

## Final Verification

Run:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`

Expected: All pass.
