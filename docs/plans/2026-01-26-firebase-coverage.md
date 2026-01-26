# Firebase Coverage Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Increase unit test coverage for Firebase services and hooks (itemService, listService, useUser/useList/useItems/useMembership/useSyncStatus).

**Architecture:** Tests use Vitest with module-level mocks of Firebase SDK + initFirebase. Hooks are exercised via React Testing Library in a jsdom test environment. Emulator-based tests remain in node environment.

**Tech Stack:** Vitest, React 19, React Testing Library, Firebase JS SDK, TypeScript.

---

### Task 0: Enable hook test environment for `@zusamn/firebase`

**Files:**
- Modify: `packages/firebase/vitest.config.ts`
- Modify: `packages/firebase/package.json`
- Modify: `packages/firebase/tests/rules.test.ts`
- Modify: `packages/firebase/tests/accountService.test.ts`

**Step 1: Write a failing hook test that requires jsdom**

Create a minimal `useList` test that renders a component and expects loading state to resolve. (Will fail without jsdom/RTL.)

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @zusamn/firebase test -- useList.test.ts`
Expected: FAIL due to missing DOM environment or missing React/RTL deps.

**Step 3: Update test tooling**

- Add devDependencies in `packages/firebase/package.json`:
  - `react`, `react-dom`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
- Update `packages/firebase/vitest.config.ts` to use `environment: 'jsdom'` for hook tests.
- Add `// @vitest-environment node` to emulator-heavy tests (`rules.test.ts`, `accountService.test.ts`) to keep them in node.

**Step 4: Re-run the hook test**

Run: `pnpm --filter @zusamn/firebase test -- useList.test.ts`
Expected: FAIL (test now runs, but hook behavior not mocked yet).

**Step 5: Commit**

```bash
git add packages/firebase/vitest.config.ts packages/firebase/package.json packages/firebase/tests/rules.test.ts packages/firebase/tests/accountService.test.ts
# include lockfile if updated
# git add pnpm-lock.yaml

git commit -m "chore: enable firebase hook tests"
```

---

### Task 1: Cover `itemService` behaviors

**Files:**
- Create: `packages/firebase/tests/itemService.test.ts`

**Step 1: Write failing tests**

Cover:
- `getItemCount` returns snapshot.size
- `addItem` rejects invalid text
- `addItem` rejects when list limit reached
- `addItem` writes trimmed text and returns item with id
- `toggleItemChecked` throws when item missing
- `toggleItemChecked` flips checked
- `softDeleteItem`/`undeleteItem` set deleted flag
- `bulkSoftDelete`/`bulkUndelete` skip empty and batch update on ids

Mock:
- `initFirebase` (return `{ db: {} }`)
- Firestore fns: `collection`, `query`, `where`, `getDocs`, `getDoc`, `setDoc`, `updateDoc`, `writeBatch`, `doc`, `serverTimestamp`
- `crypto.randomUUID`

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @zusamn/firebase test -- itemService.test.ts`
Expected: FAIL (functions unmocked / assertions not met).

**Step 3: Add minimal mocks in test to satisfy behavior**

Keep behavior-focused expectations; avoid testing implementation details beyond Firestore calls.

**Step 4: Re-run test to verify it passes**

Run: `pnpm --filter @zusamn/firebase test -- itemService.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/firebase/tests/itemService.test.ts

git commit -m "test: cover itemService"
```

---

### Task 2: Cover `listService` behaviors

**Files:**
- Create: `packages/firebase/tests/listService.test.ts`

**Step 1: Write failing tests**

Cover:
- `createPersonalList` uses locale default alias and writes list + membership via batch
- `getUserLists` returns list + membership pairs and sorts personal first, then alias
- `getPersonalList` returns null when not found or membership missing
- `hasPersonalList` returns true/false based on query snapshot empty

Mock:
- `initFirebase`
- Firestore fns: `collection`, `query`, `where`, `getDocs`, `getDoc`, `doc`, `writeBatch`, `Timestamp`

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @zusamn/firebase test -- listService.test.ts`
Expected: FAIL.

**Step 3: Add minimal mocks in test to satisfy behavior**

**Step 4: Re-run test to verify it passes**

Run: `pnpm --filter @zusamn/firebase test -- listService.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/firebase/tests/listService.test.ts

git commit -m "test: cover listService"
```

---

### Task 3: Cover Firestore hooks (useUser/useList/useItems/useMembership/useSyncStatus)

**Files:**
- Create: `packages/firebase/tests/useUser.test.tsx`
- Create: `packages/firebase/tests/useList.test.tsx`
- Create: `packages/firebase/tests/useItems.test.tsx`
- Create: `packages/firebase/tests/useMembership.test.tsx`
- Create: `packages/firebase/tests/useSyncStatus.test.tsx`

**Step 1: Write failing tests**

Use RTL to render a small component using each hook and assert state transitions:
- `useUser`: initializes new user doc when missing; handles snapshot update
- `useList`: returns list from snapshot; handles missing list
- `useItems`: maps items and filters deleted by query; handles error
- `useMembership`: returns membership from snapshot; handles missing membership
- `useSyncStatus`: `markWritePending` sets true; `onSnapshotsInSync` callback sets false

Mock Firestore:
- `onSnapshot` should call provided callback(s)
- `onSnapshotsInSync` should expose a trigger callback
- `doc`, `collection`, `query`, `where`, `orderBy`

**Step 2: Run tests to verify they fail**

Run: `pnpm --filter @zusamn/firebase test -- useUser.test.tsx`
Expected: FAIL.

**Step 3: Add minimal mocks in test to satisfy behavior**

Keep the hook-focused assertions; avoid direct UI assumptions.

**Step 4: Re-run tests to verify they pass**

Run: `pnpm --filter @zusamn/firebase test -- useUser.test.tsx`
Expected: PASS. Repeat for other hook tests.

**Step 5: Commit**

```bash
git add packages/firebase/tests/useUser.test.tsx packages/firebase/tests/useList.test.tsx packages/firebase/tests/useItems.test.tsx packages/firebase/tests/useMembership.test.tsx packages/firebase/tests/useSyncStatus.test.tsx

git commit -m "test: cover firebase hooks"
```

---

### Task 4: Full verification

**Step 1: Run full checks**

```bash
pnpm lint
pnpm typecheck
pnpm test
```

**Step 2: Commit any remaining changes**

```bash
git status -sb
# If anything remains, commit with a conventional message
```

---

## Notes
- Use `vi.resetModules()` when mocking `initFirebase` to avoid cross-test bleed.
- Keep emulator tests in node environment with `// @vitest-environment node`.
- Prefer testing observable behavior (calls, state updates) over internal implementation details.
