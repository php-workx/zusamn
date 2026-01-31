# Synthesis: Phase 5 - Multi-List Management

**Date**: 2026-01-27
**Source**: Research from 2026-01-27-phase5-multi-list-management.md

---

## TL;DR

Phase 5 adds list switching, alias renaming, and leaving shared lists. Infrastructure is 80% ready - just need UI components and two small services.

---

## What We're Building

| Feature | User Action | Implementation |
|---------|-------------|----------------|
| List Switcher | Tap TopBar title | Sheet showing all lists |
| Alias Rename | Long-press list in switcher | Edit membership.alias |
| Leave List | Overflow menu → "Leave List" | Remove membership, navigate away |
| Last-Used Persistence | Switch lists | MMKV storage (already exists) |

---

## Key Files to Create/Modify

### New Files

```
packages/firebase/src/hooks/useUserLists.ts     # Hook for getUserLists
packages/firebase/src/services/membershipService.ts  # updateAlias
apps/mobile/src/components/ListSwitcherSheet.tsx    # Main UI
apps/mobile/src/components/RenameAliasSheet.tsx     # Rename UI
```

### Modified Files

```
packages/firebase/src/services/listService.ts   # Add leaveList()
apps/mobile/app/(tabs)/index.tsx                # Wire TopBar, add Leave List menu
```

---

## Implementation Sequence

```
1. zusamn-s3d.5.1 → List Switcher sheet
   └── useUserLists hook
   └── ListSwitcherSheet component
   └── Wire TopBar.onTitlePress
   └── List navigation

2. zusamn-s3d.5.4 → Persistence (verify existing)
   └── MMKV integration on switch

3. zusamn-s3d.5.2 → Alias rename
   └── updateAlias service
   └── RenameAliasSheet component

4. zusamn-s3d.5.3 → Leave List
   └── leaveList service
   └── Overflow menu item
   └── Confirmation dialog
```

---

## Patterns to Follow

### SheetModal Usage (from ShareSheet)

```typescript
<SheetModal visible={visible} onClose={onClose} title="Switch List">
  {/* List rows here */}
</SheetModal>
```

### Service Functions (from listService.ts)

```typescript
export async function leaveList(listId: string, userId: string): Promise<void> {
  const batch = writeBatch(db);

  // Remove membership doc
  const membershipRef = doc(db, 'lists', listId, 'memberships', userId);
  batch.delete(membershipRef);

  // Remove from memberIds array
  const listRef = doc(db, 'lists', listId);
  batch.update(listRef, {
    memberIds: arrayRemove(userId)
  });

  await batch.commit();
}
```

### OverflowMenu Items (from ListDetailScreen)

```typescript
const overflowMenuItems = [
  ...(isSharedList ? [{
    label: 'Leave List',
    onPress: () => setShowLeaveDialog(true),
    destructive: true,
  }] : []),
  // ... other items
];
```

---

## Spec Compliance Checklist

- [ ] Personal list shown first in switcher
- [ ] Shared lists sorted A-Z by alias
- [ ] Shared lists have "shared" icon
- [ ] 50-char alias limit enforced
- [ ] Alias rename is per-user only
- [ ] "Leave List" only for shared lists
- [ ] "Leave List" requires confirmation
- [ ] After leave, navigate to personal list
- [ ] Last-used list persisted across launches

---

## Ready to Implement

All blocking work is complete:
- ✅ Phase 4 (US2: Sharing) closed
- ✅ `getUserLists()` service exists
- ✅ TopBar has `onTitlePress` ready
- ✅ SheetModal, TextField, ConfirmDialog exist
- ✅ MMKV hooks exist

Start with `bd update zusamn-s3d.5.1 --status in_progress`
