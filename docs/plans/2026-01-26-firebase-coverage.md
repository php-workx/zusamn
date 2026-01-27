# Firebase Coverage Plan (2026-01-26)

## Purpose
Define the minimal Firebase coverage targets for MVP1 and the tests that back them.

## Files
- `firebase/firestore.rules`
- `packages/firebase/tests/rules.test.ts`
- `packages/firebase/src/services/listService.ts`
- `packages/firebase/src/services/itemService.ts`
- `packages/firebase/src/hooks/useList.ts`
- `packages/firebase/src/hooks/useMembership.ts`
- `packages/firebase/src/hooks/useUser.ts`

## Steps
### Step 1: Rules coverage
Validate user, list, item, invite, and membership rules via emulator tests.

### Step 2: Service coverage
Add unit tests for list/item services where pure logic is exercised without emulators.

### Step 3: Hooks coverage
Ensure hooks handle loading, error, and data mapping cases (including optional fields).

### Step 4: Gaps and follow-ups
Track any missing coverage via `bd` issues and keep tests aligned with MVP1 invariants.
