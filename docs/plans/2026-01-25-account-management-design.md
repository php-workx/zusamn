# Account Management (Phase 6) Design

**Date:** 2026-01-25
**Spec:** specs/001-zusamn-mvp/spec.md (Phase 6: User Story 4)
**Scope:** Account screen UX + logout + delete account (client-side batch)

## Goals
- Provide a calm, minimal Account screen with display name and two actions: Logout and Delete Account.
- Support App Store compliance for account deletion.
- Keep implementation simple and client-driven (no Cloud Functions).
- Preserve shared lists for remaining members while removing the current user.

## User Experience
- Account tab shows the current user display name and two buttons: Logout and Delete Account.
- Logout is immediate and returns the user to the auth flow.
- Delete Account requires confirmation and only runs while online.
- If offline, the user sees a clear error and the deletion does not proceed.
- During deletion, the delete button shows a busy state to prevent double submissions.

## Data Operations (Delete Account)
Client-side batch using Firebase JS SDK:
1. Query all membership documents for the user via `collectionGroup('memberships')` with `where('userId','==', uid)`.
2. For each membership:
   - Delete the membership document.
   - Update the associated list document to remove the user from `memberIds`.
3. Soft-delete the personal list (set `deleted: true` or equivalent existing field).
4. Delete `users/{uid}`.
5. Sign out.

Shared lists remain intact for other members, only the current user is removed.

## Security Rules Notes
- Membership documents must include `userId` and `listId` fields for validation.
- Collection group read for memberships is required for the delete query.
- User can delete their own membership docs and update list `memberIds` to remove themselves.

## Error Handling
- If any step fails, surface a user-friendly message and keep the user signed in.
- No partial sign-out on failure.

## Testing Strategy
- Mobile (Jest): Account screen renders display name; logout triggers signOut; delete flow shows confirm dialog; offline delete shows error; delete action calls service and disables button.
- Firebase service tests: verify memberships deleted, list memberIds updated, personal list soft-deleted, user doc deleted.
- Rules tests: only authenticated user can read/delete own memberships and update list memberIds appropriately.

## Non-Goals
- No server-side deletion via Cloud Functions.
- No additional account settings beyond logout and delete.

