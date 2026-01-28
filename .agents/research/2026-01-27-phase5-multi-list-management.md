# Research: Phase 5 - Multi-List Management (US3)

**Date**: 2026-01-27
**Topic**: Phase 5 implementation - List Switcher, Alias Rename, Leave List
**Epic**: zusamn-s3d.5

---

## Executive Summary

Phase 5 implements US3: Multi-List Management, enabling users to switch between lists, rename their aliases, and leave shared lists. The foundation is already well-prepared: `getUserLists()` exists with correct sorting, TopBar has `onTitlePress` ready, SheetModal and TextField components exist, and MMKV persistence is implemented. This phase adds the UI layer and connects existing infrastructure.

---

## Current State

### Key Files Table

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| List query service | `packages/firebase/src/services/listService.ts:87-150` | ✅ Ready | `getUserLists()` with personal-first, alpha-sorted |
| TopBar with tappable title | `packages/ui/src/TopBar.tsx:9-10` | ✅ Ready | `onTitlePress` prop exists, accessibility hints set |
| SheetModal | `packages/ui/src/SheetModal.tsx` | ✅ Ready | Generic bottom sheet used by ShareSheet |
| TextField | `packages/ui/src/TextField.tsx` | ✅ Ready | For alias rename input |
| ConfirmDialog | `packages/ui/src/ConfirmDialog.tsx` | ✅ Ready | For leave list confirmation |
| MMKV persistence | `apps/mobile/src/hooks/useLastUsedList.ts` | ✅ Ready | Already persists last-used list ID |
| Membership service | `packages/firebase/src/services/listService.ts` | ⚠️ Partial | No `updateAlias` or `leaveList` functions yet |
| OverflowMenu | `packages/ui/src/OverflowMenu.tsx` | ✅ Ready | Used for "Clear checked", needs "Leave List" |
| ListDetailScreen | `apps/mobile/app/(tabs)/index.tsx` | ✅ Ready | Needs TopBar onTitlePress wiring |

---

## Beads Issues

### Epic: zusamn-s3d.5 - US3: Multi-List Management (P3)

**Children:**

1. **zusamn-s3d.5.1** - Create List Switcher sheet
   - Personal first, shared A-Z, shared icon, tappable TopBar title

2. **zusamn-s3d.5.2** - Implement alias rename flow
   - Long-press or edit icon, 50-char limit, per-user only

3. **zusamn-s3d.5.3** - Implement Leave List flow
   - Overflow menu (shared only), confirmation dialog, navigate to personal list

4. **zusamn-s3d.5.4** - Persist last-used list selection
   - MMKV storage, restore on app launch (note: already partially implemented)

---

## Findings

### 1. List Query Service

**File:** `packages/firebase/src/services/listService.ts:87-150`

```typescript
export async function getUserLists(userId: string): Promise<UserListResult[]> {
  // Queries lists where user is member
  // Returns {list, membership} pairs
  // Sort: personal first (ownerUserId === userId), then alphabetically by alias
}
```

**Status:** Complete and correctly implemented. Ready to use.

### 2. TopBar Tappable Title

**File:** `packages/ui/src/TopBar.tsx:9-10, 71-98`

```typescript
interface TopBarProps {
  onTitlePress?: () => void;  // Hook for list switcher
  titleAccessibilityHint?: string;  // Default: "Double tap to open list switcher"
}
```

The title area is already configured to be tappable when `onTitlePress` is provided. Just need to wire it up in ListDetailScreen.

### 3. SheetModal Pattern

**File:** `packages/ui/src/SheetModal.tsx`

Used by ShareSheet. Pattern:
- Backdrop with semi-transparent overlay
- Bottom sheet with border radius
- Visual handle indicator
- Title section
- Children content area

The ListSwitcherSheet will follow this same pattern.

### 4. MMKV Persistence

**File:** `apps/mobile/src/hooks/useLastUsedList.ts`

```typescript
const LAST_USED_LIST_ID_KEY = 'lastUsedListId';

export function getLastUsedListId(): string | null
export function setLastUsedListId(listId: string): void
export function clearLastUsedListId(): void
```

**Status:** Already implemented. Task zusamn-s3d.5.4 may be largely complete - need to verify integration in list switching flow.

### 5. Missing Services

Need to implement in `packages/firebase/src/services/`:

**updateAlias (membershipService.ts):**
```typescript
export async function updateAlias(
  listId: string,
  userId: string,
  newAlias: string
): Promise<void>
```

**leaveList (listService.ts):**
```typescript
export async function leaveList(
  listId: string,
  userId: string
): Promise<void>
// - Remove membership document
// - Remove userId from list.memberIds array
// - Cannot leave personal list (ownerUserId === userId)
```

### 6. UI Components Needed

**ListSwitcherSheet** (`packages/ui/src/ListSwitcherSheet.tsx`):
- Uses SheetModal as wrapper
- Shows list of user's lists
- Personal list first with no icon
- Shared lists with "shared" icon (users icon from Lucide)
- Each row tappable to switch
- Long-press or edit icon to rename

**RenameAliasSheet** (`apps/mobile/src/components/RenameAliasSheet.tsx`):
- Uses SheetModal
- TextField for new alias
- 50-char max (MAX_ALIAS_LENGTH from constants)
- Save/Cancel buttons

### 7. OverflowMenu Integration

**File:** `apps/mobile/app/(tabs)/index.tsx:505-511`

Currently shows only "Clear checked". Need to add "Leave List" for shared lists:

```typescript
const overflowMenuItems = [
  // ... existing items
  ...(isSharedList ? [{
    label: 'Leave List',
    onPress: () => setShowLeaveDialog(true),
    destructive: true,
  }] : []),
];
```

---

## Implementation Plan

### Task Order

1. **zusamn-s3d.5.1** - List Switcher sheet (foundation)
   - Create `useUserLists` hook
   - Create ListSwitcherSheet component
   - Wire TopBar onTitlePress
   - Integrate with list navigation

2. **zusamn-s3d.5.4** - Persist last-used list (may be mostly done)
   - Verify MMKV integration on switch
   - Verify restoration on app launch

3. **zusamn-s3d.5.2** - Alias rename flow
   - Create `updateAlias` service
   - Create RenameAliasSheet
   - Add rename trigger to list switcher

4. **zusamn-s3d.5.3** - Leave List flow
   - Create `leaveList` service
   - Add to overflow menu (shared lists only)
   - Confirmation dialog
   - Navigate to personal list after leaving

### Dependencies

- All tasks depend on zusamn-s3d.5 (epic)
- zusamn-s3d.5 depends on zusamn-s3d.4 (US2: Sharing) - ✅ CLOSED
- No blocking dependencies between subtasks

---

## Constraints & Risks

### Constraints

| Constraint | Source | Mitigation |
|------------|--------|------------|
| 50-char alias limit | `MAX_ALIAS_LENGTH` in constants | Enforce in TextField maxLength |
| Cannot leave personal list | Spec Journey 11 | Hide "Leave List" for personal list |
| Per-user aliases only | FR-SWITCH-008 | Update membership doc, not list |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| MMKV persistence race conditions | Low | Medium | Already tested in Phase 3 |
| Offline leave list edge case | Low | Low | Queue operation, sync when online |

---

## Spec References

### Functional Requirements (spec.md)

- FR-SWITCH-001: Switcher shows personal list first
- FR-SWITCH-002: Shows all shared lists
- FR-SWITCH-003: Shared lists sorted alphabetically by alias
- FR-SWITCH-004: Display user's alias for each list
- FR-SWITCH-005: Shared lists show "shared" icon
- FR-SWITCH-006: Tapping navigates to list
- FR-SWITCH-007: Rename via long-press or edit icon
- FR-SWITCH-008: Rename is per-user only
- FR-SWITCH-009: 50-char alias limit

- FR-LIST-028: Overflow menu shows "Leave List" for shared lists only
- FR-LIST-029: Leave removes from switcher, navigates to personal list
- FR-LIST-030: "Leave List" NOT available for personal list
- FR-LIST-031: Leave requires confirmation dialog

### User Journeys (spec.md)

- Journey 7: Switch Between Lists
- Journey 8: Rename List Alias (Per-User)
- Journey 11: Leave Shared List

---

## Recommendation

Start with **zusamn-s3d.5.1** (List Switcher) as it establishes the foundation. The MMKV persistence (5.4) is largely implemented and can be verified during 5.1 integration. Then implement rename (5.2) and leave (5.3) which build on the switcher UI.

**Estimated complexity:**
- 5.1 List Switcher: Medium (new UI component + hook)
- 5.2 Alias Rename: Low (simple service + sheet)
- 5.3 Leave List: Low (service + menu item + dialog)
- 5.4 Persistence: Very Low (mostly verification)

---

## Next Steps

1. Run `bd update zusamn-s3d.5 --status in_progress` to claim the epic
2. Start with `bd show zusamn-s3d.5.1` and implement List Switcher
3. Use /implement for each task
