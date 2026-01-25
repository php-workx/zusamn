# Feature Specification: Zusamn MVP

**Feature Branch**: `001-zusamn-mvp`
**Created**: 2026-01-25
**Updated**: 2026-01-25
**Status**: Draft
**Input**: MVP product specification for cross-platform collaborative shopping list app

---

## Clarifications

### Session 2026-01-25

- Q: How should items be ordered in the list? → A: Hybrid — newest unchecked items at top (reverse chronological), checked items sink to bottom.
- Q: After adding an item, should the keyboard stay open or dismiss? → A: Keyboard stays open for rapid multi-item entry.
- Q: If social login doesn't provide a first name, what fallback for share name default? → A: Prompt user for display name during onboarding.
- Q: What should users see when a list has no items? → A: Helpful prompt (e.g., "Add your first item") with input focused.
- Q: Should there be a limit on items per list? → A: 200 items maximum per list (total, including checked and unchecked).

### PM Review 2026-01-25

- Navigation: Bottom tab bar with Lists + Account tabs
- Account screen: Minimal for MVP1 (logout + display name)
- Offline/sync indicators: Subtle subtitle under TopBar title
- Conflict resolution: Silent reconciliation, server-authoritative
- Delete behavior: 5-second undo toast
- Clear checked location: TopBar overflow menu
- Sharing permissions: Any member can create invites (if <3 members)
- Invite page sharer info: Display name + avatar/initials only, never email
- Checked item animation: ~500ms delay before sinking
- Remote changes during typing: Deferred until typing ends
- Localization: German + English fallback only for MVP1
- Limits: 100 chars item text, 50 chars alias, 200 items per list

### QA/Support Review 2026-01-25

- Delete Account: Added for App Store compliance (immediate, self-serve)
- Leave List: Added for shared lists only (user escape hatch)
- Web invite accept: Added warning about using same login method in app
- Improved 200-item limit error message
- Clarified deletion-wins conflict rule (no zombie items)

### Patch Session 2026-01-25 (P1–P16)

- P1: Empty/whitespace submission ignored silently (no error toast)
- P2: Undo toast overlap — dismiss previous toast, show new one (no stacking)
- P3: Deep link fallback — if app installed but deep link fails, redirect to web invite page
- P4: "Actively typing" defined as input field has focus
- P5: Web existing session — show identity confirmation before invite acceptance
- P6: Undo cancels pending offline delete — restore queued locally, syncs when online
- P7: Member visibility — when Share disabled (3 members), show member names in share sheet
- P8: Clear checked — confirmation dialog showing count before clearing
- P9: Leave list — already in MVP1 via TopBar overflow menu
- P10: Delete gesture — swipe-left OR long-press (both supported)
- P11: Share sheet — shows "Link expires in 7 days" notice
- P12: Status subtitle priority — "Offline" takes precedence over "Sync pending"
- P13: List switcher ordering — personal first, then shared lists alphabetically by alias
- P14: Timing tolerances — 500ms±100ms (check sink), 2000ms±200ms (remote highlight)
- P15: Input field placement — fixed at bottom, above keyboard when open
- P16: Out of scope — no activity log or change history for MVP1

---

## 1. Overview

### Vision

Zusamn is a calm, iOS-ish, offline-first shopping list that syncs across iOS and Android and supports small-group collaboration without annoyance. The core loop is: **open list → add item → check item**.

### MVP Goals

The MVP must prove four things:

1. **Fast core loop**: Adding and checking items is frictionless
2. **Offline-first**: Core list actions work offline and sync safely later
3. **Collaboration**: Invite someone to a list and see updates near-instantly without spam
4. **Invite acceptance works without app installed**: Web-based invite acceptance flow (Option B)

### App Structure

**Bottom Tab Navigation**:
- **Tab 1: Lists** — Root screen is List Detail; opens last-used list (first run opens personal default list)
- **Tab 2: Account** — Screen with display name, logout, and delete account

**Status Indicators** (calm UX):
- Subtle offline indicator shown as small subtitle under TopBar title when device lacks connectivity
- Subtle sync-pending indicator shown when local changes are queued awaiting upload
- **Priority rule**: "Offline" takes precedence over "Sync pending" (show "Offline" if device lacks connectivity, regardless of pending changes)
- Indicators appear only when relevant; no noisy banners

**Conflict Resolution**:
- Server-authoritative ordering for conflict resolution (not device clock)
- When local changes are overwritten by remote state, app reconciles silently (no conflict dialogs)
- Item deletions take precedence: if an item is deleted on the server while another device edits it offline, the item remains deleted after sync (offline edits do not resurrect deleted items)
- UI updates reflect final state; user discovers changes via the updated list

---

## 2. Personas / Primary Use Cases

### Persona A: The Household Coordinator

**Who**: A member of a couple, family, or roommate group who coordinates grocery shopping.

**Context**: Multiple people contribute to what needs to be bought. Someone shops while others add items from home. Trust is implicit—no need for permissions or approvals.

**Core need**: See what the household needs, add items when thinking of them, check items off while shopping.

### Persona B: The Low-Connectivity Shopper

**Who**: Anyone shopping in environments with poor or no network (basement stores, rural areas, traveling).

**Context**: Needs to access and modify their list regardless of signal. Changes should sync when connectivity returns.

**Core need**: The app works offline. Period.

---

## 3. User Journeys

### Journey 1: First Run (Mobile)

**Actor**: New user on iOS or Android

1. User opens Zusamn for the first time
2. App presents authentication options: Google Sign-In and Apple Sign-In
3. User taps their preferred auth provider
4. User completes OAuth flow
5. If social login does not provide a first name:
   - App prompts user for display name before proceeding
6. On successful authentication:
   - System creates (or retrieves existing) user's personal default list
   - System assigns localized alias: "Einkaufen" (German locale) or "Shopping" (English fallback)
7. App displays bottom tab bar (Lists + Account)
8. Lists tab is selected; app navigates directly to List Detail showing the personal list
9. User sees empty list with helpful prompt (e.g., "Add your first item") and input focused

**Note**: There is no list overview screen on first run—user lands directly in their list.

---

### Journey 2: Add / Check / Delete Items (Including Offline)

**Actor**: Authenticated user on List Detail screen

#### Adding an item

1. User taps the input field fixed at the bottom of the screen
2. Keyboard opens; input field remains visible above the keyboard
3. User types item name (e.g., "Milk") — limited to 100 characters
4. User taps submit button (or presses Enter/Return)
5. **Empty/whitespace-only submissions are ignored silently** (no error toast)
6. Item appears in the list immediately at the top (newest first)
7. Keyboard remains open for rapid multi-item entry
8. Tapping outside the input field dismisses the keyboard
9. If offline: item is queued locally; sync-pending indicator appears
10. On reconnect: item syncs to server; indicator clears

#### Checking an item

1. User taps an unchecked item
2. Item shows as checked (strikethrough or visual indicator)
3. After 500ms (±100ms tolerance), item animates smoothly to the bottom/checked section
4. If offline: change is queued locally and syncs when online

#### Unchecking an item

1. User taps a checked item
2. Item returns to unchecked state
3. Item animates back to appropriate position in unchecked section (by creation time)
4. If offline: change is queued locally and syncs when online

#### Deleting an item

1. User swipes item left OR long-presses item
2. Delete action is revealed/triggered
3. User confirms delete (implicit via swipe completion or explicit tap)
4. Item is removed from list
5. System shows 5-second undo toast at bottom of screen
6. **If another undo toast is already showing, dismiss it and show the new one** (no stacking)
7. If user taps "Undo" within 5 seconds: item is restored
8. If offline: deletion is queued locally and syncs when online
9. **If user undoes while offline: restore is queued locally and syncs when online** (undo cancels pending offline delete)

#### Remote changes while typing

- "Actively typing" is defined as: **input field has focus**
- While user is actively typing (input field has focus), remote highlight effects and checked-item sinking animations are deferred
- Animations and highlights apply after user stops typing (input loses focus) or submits

---

### Journey 3: Clear Checked Items

**Actor**: Authenticated user on List Detail screen with checked items

1. User taps overflow menu ("…") in TopBar
2. User taps "Clear checked" action
3. **System shows confirmation dialog with count**: "Clear N checked items?" with Cancel/Clear options
4. User taps "Clear" to confirm
5. All checked items are deleted in one action
6. System shows 5-second undo toast: "Checked items cleared" with Undo action
7. **If another undo toast is already showing, dismiss it and show the new one** (no stacking)
8. If user taps "Undo" within 5 seconds: all cleared items are restored
9. If offline: deletions are queued locally and sync when online

---

### Journey 4: Share List (Mobile)

**Actor**: Authenticated user on any list they have access to

**Precondition**: List has fewer than 3 members

1. User taps "Share" button on List Detail screen
2. If list already has 3 members:
   - Share button is disabled
   - Tooltip or message explains "This list is full (maximum 3 people)"
   - **Share sheet shows current member names** (so user knows who is on the list)
3. Modal/sheet appears with:
   - Editable "Share name" field (max 50 characters)
   - Suggested default: `<FirstName> – Shopping` (or `<FirstName> – Einkaufen` for German locale)
   - **Notice: "Link expires in 7 days"**
4. User can edit the share name or accept default
5. User taps "Create invite link"
6. System generates a unique invite link containing:
   - Invite token
   - inviteAlias = the share name
7. System presents OS share sheet with the link (or copy-to-clipboard option)
8. User shares link via their preferred method (Messages, WhatsApp, email, etc.)
9. After sharing, system shows brief confirmation toast: "Link shared"
10. User returns to List Detail

**Constraints**:
- Maximum 3 members per list (hard limit)
- Any list member may create invites (not just owner), subject to member limit
- Invite expires after 7 days
- Invite is one-time use (can only be accepted by one person)

**Note**: Sharer's own alias does NOT change when they share the list.

---

### Journey 5: Invite Acceptance — App IS Installed

**Actor**: User who received an invite link and has Zusamn installed

1. User taps invite link (from Messages, email, etc.)
2. Deep link attempts to open Zusamn app
3. **If deep link fails** (e.g., universal link not registered, app in bad state):
   - System redirects to web invite landing page (fallback)
   - User continues with web flow (Journey 6)
4. If deep link succeeds, app opens
5. If user is not authenticated:
   - App prompts for authentication (Google or Apple)
   - After auth, flow continues with step 6
6. **Important**: Invite acceptance applies to the currently logged-in user
   - If user intended a different account, they must log out first and retry
7. App validates the invite:
   - Check if expired → show error: "This invite has expired"
   - Check if already used → show error: "This invite has already been used"
   - Check if list is full → show error: "This list is full (maximum 3 people)"
   - Check if user already a member → show message: "You're already a member of this list" and navigate to list
8. If valid, system creates membership with:
   - alias = inviteAlias from the invite
9. App navigates to List Detail of the newly joined list
10. Joined list now appears in the list switcher

---

### Journey 6: Invite Acceptance — App NOT Installed (Web Accept First)

**Actor**: User who received an invite link and does NOT have Zusamn installed

1. User taps invite link
2. Browser opens a lightweight invite landing page (NOT a full web app)
3. Page displays:
   - Invite context: share name prominently displayed
   - Sharer info: display name and avatar (or initials if no avatar); **never displays email**
   - **Warning near auth buttons**: "Important: Use the same login method in the app to see this list."
   - Authentication options: Google and Apple buttons
4. **If user already has a web session** (logged in from previous visit):
   - Page shows identity confirmation: "Continue as [Display Name]?" with options to continue or switch account
   - User confirms or switches account before proceeding
5. User authenticates via web OAuth (or confirms existing session)
6. Web flow validates the invite:
   - Expired → show error page: "This invite has expired. Ask [Sharer] for a new invite."
   - Already used → show error page: "This invite has already been used. Ask [Sharer] for a new invite."
   - List full → show error page: "This list is full (maximum 3 people)."
   - Already a member → show message: "You're already a member of this list" with "Open Zusamn" / "Install Zusamn" buttons
7. If valid, web flow accepts invite server-side:
   - Creates user account if new
   - Creates membership with alias = inviteAlias
8. Page shows success with:
   - **Provider confirmation**: "Joined with Google" or "Joined with Apple" (whichever was used)
   - "Open Zusamn" button (universal link / deep link)
   - "Install Zusamn" button (links to App Store / Play Store)
9. User installs app (if needed)
10. User opens app and authenticates (**must use same provider as web** to see the list)
11. The joined shared list appears automatically in list switcher (membership already exists server-side)

---

### Journey 7: Switch Between Lists

**Actor**: Authenticated user with multiple lists

1. User taps list switcher control (current list name in TopBar)
2. List switcher sheet appears showing:
   - **Personal default list first** (with user's alias)
   - **Shared lists below, sorted alphabetically by alias** (with small "shared" icon for each)
3. User taps a different list
4. App navigates to List Detail of selected list
5. Selected list becomes the "last-used list" for next app launch

---

### Journey 8: Rename List Alias (Per-User)

**Actor**: Authenticated user in list switcher

1. User opens list switcher
2. User long-presses on a list name (or taps edit icon)
3. Rename sheet appears with current alias
4. User edits the alias (max 50 characters)
5. User confirms (tap "Save" or similar)
6. New alias is saved for this user only
7. Other members' aliases for this list are unaffected

---

### Journey 9: Logout

**Actor**: Authenticated user who needs to switch accounts or troubleshoot

1. User taps Account tab in bottom navigation
2. Account screen displays:
   - User's display name
   - Logout button
   - Delete Account button
3. User taps "Logout"
4. System clears local session
5. App returns to authentication screen
6. Local data remains cached (for potential re-login); syncs fresh on next login

---

### Journey 10: Delete Account

**Actor**: Authenticated user who wants to permanently delete their account

1. User taps Account tab in bottom navigation
2. User taps "Delete Account"
3. System shows confirmation dialog:
   - Title: "Delete Account?"
   - Message: "This will permanently delete your account and remove you from all shared lists. This cannot be undone."
   - Buttons: "Cancel" / "Delete Account" (destructive)
4. User taps "Delete Account" to confirm
5. System immediately:
   - Removes user from all list memberships (shared lists remain for other members)
   - Soft-deletes user's personal default list (if no other members)
   - Permanently deletes user account and associated personal data
   - Logs user out
6. App returns to authentication screen
7. User can create a new account if desired

**Note**: Deletion is immediate with no grace period. This is required for App Store compliance.

---

### Journey 11: Leave Shared List

**Actor**: Authenticated user who wants to leave a shared list

**Precondition**: User is viewing a shared list (not their personal default list)

1. User taps overflow menu ("…") in TopBar
2. User taps "Leave List" action
3. System shows confirmation dialog:
   - Message: "Leave this list? You'll lose access."
   - Buttons: "Cancel" / "Leave" (destructive)
4. User taps "Leave" to confirm
5. System removes user's membership from the list
6. List is immediately removed from user's list switcher
7. App navigates to user's personal default list
8. If offline: leave action is queued and syncs when online; list remains visible until sync completes

**Note**: "Leave List" action is NOT available for the user's personal default list (personal list cannot be left).

---

## 4. Functional Requirements by Screen

### 4.1 Mobile Auth / First Run

| ID          | Requirement                                                                                           |
|-------------|-------------------------------------------------------------------------------------------------------|
| FR-AUTH-001 | System MUST support Google Sign-In                                                                    |
| FR-AUTH-002 | System MUST support Apple Sign-In                                                                     |
| FR-AUTH-003 | After successful authentication, system MUST create or retrieve the user's personal default list     |
| FR-AUTH-004 | Personal default list alias MUST be "Einkaufen" for German locale, "Shopping" for English fallback   |
| FR-AUTH-005 | After first login, app MUST navigate directly to List Detail via Lists tab                            |
| FR-AUTH-006 | System MUST persist authentication across app launches                                                |
| FR-AUTH-007 | If social login does not provide a first name, system MUST prompt user for display name during onboarding |
| FR-AUTH-008 | System MUST provide logout action accessible from Account tab                                         |

### 4.2 Bottom Tab Navigation

| ID         | Requirement                                                                                            |
|------------|--------------------------------------------------------------------------------------------------------|
| FR-NAV-001 | App MUST display bottom tab bar with two tabs: Lists and Account                                       |
| FR-NAV-002 | Lists tab MUST open List Detail screen showing last-used list (or personal default on first run)       |
| FR-NAV-003 | Account tab MUST open Account screen                                                                   |
| FR-NAV-004 | Tab bar MUST remain visible on List Detail and Account screens                                         |

### 4.3 List Detail (Core Screen)

| ID          | Requirement                                                                                           |
|-------------|-------------------------------------------------------------------------------------------------------|
| FR-LIST-001 | Screen MUST display all items in the current list                                                     |
| FR-LIST-002 | Screen MUST provide an input field fixed at the bottom of the screen; when keyboard opens, input MUST remain visible above keyboard |
| FR-LIST-003 | System MUST add item to list when user submits input; **empty or whitespace-only submissions MUST be ignored silently** |
| FR-LIST-004 | Users MUST be able to check/uncheck items by tapping                                                  |
| FR-LIST-005 | Checked items MUST have visual distinction (strikethrough or similar)                                 |
| FR-LIST-006 | Users MUST be able to delete items via swipe-left OR long-press (both gestures supported)             |
| FR-LIST-007 | After deleting an item, system MUST show 5-second undo toast; tapping Undo restores the item          |
| FR-LIST-008 | Screen MUST provide "Clear checked" action in TopBar overflow menu ("…"); action MUST show confirmation with count ("Clear N checked items?") before proceeding |
| FR-LIST-009 | After clearing checked items, system MUST show 5-second undo toast; tapping Undo restores items       |
| FR-LIST-010 | All actions (add, check, uncheck, delete, clear checked) MUST work offline                            |
| FR-LIST-011 | Changes MUST queue locally when offline and sync automatically on reconnect                           |
| FR-LIST-012 | When online, changes from other members MUST sync promptly (target: within 5 seconds)                 |
| FR-LIST-013 | Items changed by another member MUST briefly highlight (2000ms ±200ms tolerance)                      |
| FR-LIST-014 | Screen MUST provide access to "Share" action                                                          |
| FR-LIST-015 | Screen MUST provide access to list switcher via TopBar (tappable list name)                           |
| FR-LIST-016 | Unchecked items MUST display newest-first (reverse chronological by creation time)                    |
| FR-LIST-017 | When checked, item MUST animate to bottom section after 500ms (±100ms tolerance) with subtle animation |
| FR-LIST-018 | After adding an item, keyboard MUST remain open for rapid multi-item entry                            |
| FR-LIST-019 | Tapping outside the input field MUST dismiss the keyboard                                             |
| FR-LIST-020 | When list is empty, screen MUST show helpful prompt (e.g., "Add your first item") with input focused  |
| FR-LIST-021 | System MUST enforce max 200 items per list; if limit reached, show error: "List full (200 items). Clear checked items to add more." |
| FR-LIST-022 | Item text MUST be limited to 100 characters; enforce at input                                         |
| FR-LIST-023 | Screen MUST show subtle offline indicator (as TopBar subtitle) when device lacks connectivity         |
| FR-LIST-024 | Screen MUST show subtle sync-pending indicator (as TopBar subtitle) when local changes await upload   |
| FR-LIST-025 | **Status subtitle priority**: "Offline" MUST take precedence over "Sync pending" when device lacks connectivity |
| FR-LIST-026 | While user is actively typing (input field has focus), remote highlight effects and sinking animations MUST be deferred |
| FR-LIST-027 | Conflict resolution MUST use server-authoritative ordering; local changes overwritten by server state are reconciled silently |
| FR-LIST-028 | TopBar overflow menu MUST provide "Leave List" action for shared lists only                           |
| FR-LIST-029 | Leaving a shared list MUST remove it from the user's list switcher immediately and navigate to personal default list |
| FR-LIST-030 | "Leave List" action MUST NOT be available for user's personal default list                            |
| FR-LIST-031 | "Leave List" MUST require confirmation dialog: "Leave this list? You'll lose access." with Cancel/Leave options |
| FR-LIST-032 | **Undo toast behavior**: If an undo toast is already showing when a new delete/clear occurs, the previous toast MUST be dismissed and the new one shown (no stacking) |

### 4.4 List Switcher (Sheet)

| ID            | Requirement                                                                                         |
|---------------|-----------------------------------------------------------------------------------------------------|
| FR-SWITCH-001 | Switcher MUST show the user's personal default list **first**                                       |
| FR-SWITCH-002 | Switcher MUST show all lists shared with the user via accepted invites                              |
| FR-SWITCH-003 | **Shared lists MUST be sorted alphabetically by alias** (after personal list)                       |
| FR-SWITCH-004 | Each list MUST display using the user's alias for that list                                         |
| FR-SWITCH-005 | Shared lists MUST display a small "shared" icon                                                     |
| FR-SWITCH-006 | Tapping a list MUST navigate to that list's List Detail                                             |
| FR-SWITCH-007 | Users MUST be able to rename their alias for any list (via long-press or edit icon)                 |
| FR-SWITCH-008 | Renaming alias MUST NOT affect other members' aliases                                               |
| FR-SWITCH-009 | List alias MUST be limited to 50 characters; enforce at input                                       |

### 4.5 Share Flow (Sheet)

| ID           | Requirement                                                                                          |
|--------------|------------------------------------------------------------------------------------------------------|
| FR-SHARE-001 | Share action MUST present an editable "Share name" field (max 50 characters)                         |
| FR-SHARE-002 | Default share name MUST be `<FirstName> – Shopping` (or `<FirstName> – Einkaufen` for German locale) |
| FR-SHARE-003 | System MUST generate a unique invite link containing the inviteAlias                                 |
| FR-SHARE-004 | System MUST support OS share sheet and copy-to-clipboard                                             |
| FR-SHARE-005 | Invite link MUST expire after 7 days                                                                 |
| FR-SHARE-006 | Invite link MUST be one-time use                                                                     |
| FR-SHARE-007 | If list has 3 members, Share action MUST be disabled with friendly explanation                       |
| FR-SHARE-008 | **When Share is disabled (3 members), share sheet MUST display current member names**                |
| FR-SHARE-009 | Sharer's own alias MUST NOT change when sharing                                                      |
| FR-SHARE-010 | Any list member MAY create invites (not just owner), subject to 3-member limit                       |
| FR-SHARE-011 | After sharing, system MUST show brief confirmation toast: "Link shared"                              |
| FR-SHARE-012 | **Share sheet MUST display "Link expires in 7 days" notice**                                         |

### 4.6 Account Screen

| ID           | Requirement                                                                                          |
|--------------|------------------------------------------------------------------------------------------------------|
| FR-ACCT-001  | Screen MUST display user's display name                                                              |
| FR-ACCT-002  | Screen MUST provide Logout button                                                                    |
| FR-ACCT-003  | Tapping Logout MUST clear local session and return to authentication screen                          |
| FR-ACCT-004  | After logout, local data MAY remain cached for potential re-login                                    |
| FR-ACCT-005  | Screen MUST provide "Delete Account" action; deletion MUST be immediate (no grace period), require explicit confirmation ("Delete Account?" with Cancel/Delete options), permanently delete user account and associated personal data, remove user from all list memberships, and log user out |

### 4.7 Invite Landing/Accept Page (Web)

| ID         | Requirement                                                                                            |
|------------|--------------------------------------------------------------------------------------------------------|
| FR-WEB-001 | Page MUST be a lightweight landing page (NOT a full web app)                                           |
| FR-WEB-002 | Page MUST display invite context: share name prominently                                               |
| FR-WEB-003 | Page MUST display sharer info: display name and avatar (or initials if no avatar)                      |
| FR-WEB-004 | Page MUST NOT display sharer email (privacy)                                                           |
| FR-WEB-005 | Page MUST offer Google Sign-In authentication                                                          |
| FR-WEB-006 | Page MUST offer Apple Sign-In authentication                                                           |
| FR-WEB-007 | After auth, system MUST validate invite (expired, used, full, already member)                          |
| FR-WEB-008 | For expired invite, page MUST show: "This invite has expired. Ask [Sharer] for a new invite."          |
| FR-WEB-009 | For already-used invite, page MUST show: "This invite has already been used. Ask [Sharer] for a new invite." |
| FR-WEB-010 | For full list, page MUST show: "This list is full (maximum 3 people)"                                  |
| FR-WEB-011 | For existing member, page MUST show: "You're already a member of this list" with app links             |
| FR-WEB-012 | On valid invite, system MUST accept invite server-side (create membership)                             |
| FR-WEB-013 | Membership alias MUST be set to inviteAlias from invite                                                |
| FR-WEB-014 | After acceptance, page MUST offer "Open Zusamn" link (universal/deep link)                             |
| FR-WEB-015 | After acceptance, page MUST offer "Install Zusamn" link to app stores                                  |
| FR-WEB-016 | Page MUST display prominent warning near auth buttons: "Important: Use the same login method in the app to see this list." |
| FR-WEB-017 | After successful acceptance, page MUST display which provider was used: "Joined with Google" or "Joined with Apple" |
| FR-WEB-018 | **If user has existing web session, page MUST show identity confirmation ("Continue as [Name]?") before accepting invite** |

### 4.8 Deep Link Handling

| ID         | Requirement                                                                                            |
|------------|--------------------------------------------------------------------------------------------------------|
| FR-DEEP-001 | Invite deep links MUST attempt to open the native app first                                           |
| FR-DEEP-002 | **If deep link fails (app not responding, universal link not registered), system MUST redirect to web invite page as fallback** |

---

## 5. Edge Cases & Constraints

### 5.1 Offline → Online Reconciliation

| Scenario                                                       | Expected Behavior                                              |
|----------------------------------------------------------------|----------------------------------------------------------------|
| User adds items while offline, then reconnects                 | Items sync to server; appear for other members                 |
| Two users add the same item offline                            | Both items appear (no strict duplicate prevention in MVP)      |
| User checks item offline; another user deletes it online       | On sync, deletion wins (item disappears silently)              |
| User deletes item offline; another user checks it online       | On sync, deletion wins (item disappears silently)              |
| Item deleted on server; another device edits it offline        | Deletion wins; offline edits do NOT resurrect deleted items    |
| Conflicting edits to same item                                 | Server-authoritative resolution; final state reflected in UI   |
| User undoes delete while offline                               | **Restore is queued locally; syncs when online (cancels pending offline delete)** |
| User leaves list while offline                                 | Leave is queued; list remains visible until sync completes     |

**Conflict Resolution Policy**: Server-authoritative ordering. Item deletions take precedence over offline edits — deleted items cannot be resurrected by offline changes. When local changes are overwritten by remote state, app reconciles silently (no conflict dialogs). UI updates to reflect final state.

### 5.2 Invite Acceptance Failure Cases

| Error Case                    | User Message                                                      | Recovery                               |
|-------------------------------|-------------------------------------------------------------------|----------------------------------------|
| Invite expired (>7 days)      | "This invite has expired. Ask [Sharer] for a new invite."         | Request new invite from sharer         |
| Invite already used           | "This invite has already been used. Ask [Sharer] for a new invite." | Request new invite from sharer       |
| List at capacity (3 members)  | "This list is full (maximum 3 people)"                            | Sharer must remove a member first      |
| User already a member         | "You're already a member of this list"                            | Navigate to app / show app links       |
| List item limit reached       | "List full (200 items). Clear checked items to add more."         | Delete items or clear checked to free space |
| **Deep link fails**           | **Redirect to web invite page**                                   | Continue with web flow                 |

### 5.3 Invite Link Opened While Already Logged In

| Scenario                                          | Expected Behavior                                                  |
|---------------------------------------------------|-------------------------------------------------------------------|
| User A logged in, taps invite link                | Invite applies to User A (currently logged-in user)                |
| User intended different account                   | User must log out first, then retry invite link                    |
| **User has existing web session**                 | **Page shows identity confirmation before accepting invite**       |

### 5.4 Web Invite Accept — Provider Mismatch

| Scenario                                          | Expected Behavior                                                  |
|---------------------------------------------------|-------------------------------------------------------------------|
| User accepts invite on web with Google            | Warning displayed before auth; "Joined with Google" shown after   |
| User then opens app with Apple Sign-In            | Shared list does NOT appear (different account)                    |
| User realizes mismatch                            | User must log out of app, log in with Google to see shared list   |

**Prevention**: Web invite page displays prominent warning: "Important: Use the same login method in the app to see this list."

### 5.5 Multi-Device Expectations

| Scenario                                          | Expected Behavior                                                  |
|---------------------------------------------------|-------------------------------------------------------------------|
| User logs in on second device                     | All lists and memberships appear                                   |
| User makes change on Device A                     | Change appears on Device B promptly (when online)                  |
| User is offline on Device A, online on Device B   | Device B sees changes from other members; Device A syncs later     |
| User logs out on one device                       | Other devices remain logged in                                     |

### 5.6 Delete Account

| Scenario                                          | Expected Behavior                                                  |
|---------------------------------------------------|-------------------------------------------------------------------|
| User deletes account while member of shared lists | User is removed from all shared lists; lists remain for other members |
| User deletes account; personal list has no other members | Personal list is soft-deleted                                |
| User deletes account while offline                | Action requires connectivity (cannot complete offline)             |

### 5.7 Leave List

| Scenario                                          | Expected Behavior                                                  |
|---------------------------------------------------|-------------------------------------------------------------------|
| User leaves shared list while online              | Membership removed immediately; list disappears from switcher      |
| User leaves shared list while offline             | Leave queued; list remains visible until sync completes            |
| User tries to leave personal default list         | "Leave List" action not available for personal list                |
| Last member leaves shared list                    | List becomes orphaned (no members); may be cleaned up server-side  |

### 5.8 Localization (MVP1)

| Element                       | German Locale               | English Fallback (all others) |
|-------------------------------|-----------------------------|-------------------------------|
| Personal list default alias   | "Einkaufen"                 | "Shopping"                    |
| Share name suggestion         | `<FirstName> – Einkaufen`   | `<FirstName> – Shopping`      |

**MVP1 Scope**: German and English only. Full i18n is post-MVP.

**Note**: FirstName is extracted from the user's social login profile. If unavailable, user is prompted for display name during onboarding.

### 5.9 Limits & Validation

| Limit                    | Value          | Enforcement                                                        |
|--------------------------|----------------|--------------------------------------------------------------------|
| Items per list           | 200 total      | Prevent adding; show: "List full (200 items). Clear checked items to add more." |
| Item text length         | 100 characters | Enforce at input; truncate display if needed                       |
| List alias length        | 50 characters  | Enforce at input; truncate display if needed                       |
| Members per list         | 3 maximum      | Prevent invites when full                                          |
| Invite validity          | 7 days         | Reject expired invites with friendly error                         |
| Invite usage             | One-time       | Reject reused invites with friendly error                          |

### 5.10 Timing Tolerances

| Animation/Effect                | Target Duration | Tolerance       |
|---------------------------------|-----------------|-----------------|
| Checked item sinks to bottom    | 500ms           | ±100ms          |
| Remote change highlight         | 2000ms          | ±200ms          |

---

## 6. Key Entities

### User

- Unique identifier
- Display name (from social login or prompted during onboarding)
- Email (from social login)
- Avatar URL (from social login, optional)
- Locale preference (for alias defaults)

### List

- Unique identifier
- Owner (user who created it)
- Creation timestamp

### Membership

- Links User to List
- Alias (per-user display name for the list, max 50 characters)
- Role (owner vs. member—implicit based on who created)
- Joined timestamp

### Item

- Unique identifier
- List reference
- Text (item name, max 100 characters)
- Checked status (boolean)
- Created by (user reference)
- Created timestamp
- Last modified timestamp
- Deleted flag (soft-delete for undo support)

### Invite

- Unique token
- List reference
- inviteAlias (share name, max 50 characters)
- Created by (user reference)
- Created timestamp
- Expires timestamp (created + 7 days)
- Used flag (boolean)
- Used by (user reference, if used)

---

## 7. Success Criteria

### Measurable Outcomes

| ID     | Criterion                                                                                          |
|--------|---------------------------------------------------------------------------------------------------|
| SC-001 | Users can add an item to their list in under 3 seconds (from tapping input to seeing item)        |
| SC-002 | Users can check/uncheck an item with a single tap, completing in under 1 second                   |
| SC-003 | Core actions (add, check, delete) work with zero network latency when offline                     |
| SC-004 | Changes from other members appear within 5 seconds when all parties are online                    |
| SC-005 | 90% of users complete first-run (auth → first item added) within 60 seconds                       |
| SC-006 | Users can share a list and have invitee join within 2 minutes (app installed case)                |
| SC-007 | Users can share a list and have invitee join within 5 minutes (app not installed, incl install)   |
| SC-008 | Highlight animation for remote changes is noticeable but not disruptive                           |
| SC-009 | Undo toast appears within 200ms of delete action                                                  |
| SC-010 | Offline and sync-pending indicators appear within 1 second of state change                        |

---

## 8. Acceptance Criteria Checklist (MVP Definition of Done)

### Authentication & First Run

- [ ] Google Sign-In works on iOS and Android
- [ ] Apple Sign-In works on iOS and Android
- [ ] Display name prompt appears if social login lacks first name
- [ ] Personal default list is auto-created on first login
- [ ] Personal list alias respects locale (German → "Einkaufen", else → "Shopping")
- [ ] User lands directly on List Detail (via Lists tab) after first login
- [ ] Bottom tab bar displays with Lists and Account tabs

### List Detail

- [ ] User can add items via input field + submit
- [ ] **Input field is fixed at bottom of screen, visible above keyboard when open**
- [ ] **Empty/whitespace submissions are ignored silently (no error toast)**
- [ ] Item text limited to 100 characters
- [ ] Keyboard stays open after adding item
- [ ] Tapping outside input dismisses keyboard
- [ ] User can check/uncheck items by tapping
- [ ] Checked items have visual distinction
- [ ] **Checked items sink to bottom after 500ms (±100ms tolerance) with subtle animation**
- [ ] **User can delete items via swipe-left OR long-press (both work)**
- [ ] 5-second undo toast appears after delete
- [ ] **If undo toast already showing, dismiss it and show new one (no stacking)**
- [ ] Undo restores deleted item
- [ ] **"Clear checked" action shows confirmation with count before clearing**
- [ ] Undo toast appears after clearing checked items
- [ ] All actions work offline
- [ ] Offline indicator appears as TopBar subtitle when offline
- [ ] Sync-pending indicator appears when changes await upload
- [ ] **"Offline" takes precedence over "Sync pending" in status subtitle**
- [ ] Offline changes sync on reconnect
- [ ] Remote changes appear promptly when online
- [ ] **Remote changes briefly highlight (2000ms ±200ms)**
- [ ] **Highlights/animations deferred while input field has focus**
- [ ] 200-item limit shows error: "List full (200 items). Clear checked items to add more."
- [ ] Conflicts resolved silently (server-authoritative)
- [ ] Item deletions take precedence over offline edits (no zombie items)
- [ ] **Undo while offline cancels pending delete (restore queued locally)**
- [ ] "Leave List" action appears in overflow menu for shared lists only
- [ ] "Leave List" action does NOT appear for personal default list
- [ ] "Leave List" shows confirmation dialog before leaving
- [ ] After leaving, list is removed from switcher and app navigates to personal list

### List Switcher

- [ ] Shows personal default list **first**
- [ ] Shows shared lists **sorted alphabetically by alias**
- [ ] Shared lists display "shared" icon
- [ ] Displays user's alias for each list (max 50 chars)
- [ ] Tapping a list navigates to its List Detail
- [ ] User can rename their alias for any list
- [ ] Alias rename is per-user only

### Sharing

- [ ] Share button accessible from List Detail
- [ ] Share button disabled with explanation when list is full (3 members)
- [ ] **When Share disabled, share sheet shows member names**
- [ ] Any member can create invites (not just owner)
- [ ] Share name is editable with localized default (max 50 chars)
- [ ] **Share sheet displays "Link expires in 7 days" notice**
- [ ] Invite link is generated and can be shared via OS share sheet
- [ ] Invite link can be copied to clipboard
- [ ] "Link shared" toast appears after sharing
- [ ] Invite expires after 7 days
- [ ] Invite is one-time use
- [ ] Full list (3 members) prevents new invites

### Invite Acceptance (App Installed)

- [ ] Deep link opens app
- [ ] **If deep link fails, redirect to web invite page (fallback)**
- [ ] User is prompted to auth if not logged in
- [ ] Invite applies to currently logged-in user
- [ ] Expired invite shows friendly error
- [ ] Used invite shows friendly error
- [ ] Full list shows friendly error
- [ ] Already a member shows message and navigates to list
- [ ] Valid invite creates membership with correct alias
- [ ] User navigates to joined list

### Invite Acceptance (Web Flow)

- [ ] Landing page displays share name prominently
- [ ] Landing page shows sharer display name + avatar/initials
- [ ] Landing page does NOT show sharer email
- [ ] **Warning displayed near auth buttons: "Important: Use the same login method in the app to see this list."**
- [ ] **If existing web session, identity confirmation shown before accepting**
- [ ] Google Sign-In works on web page
- [ ] Apple Sign-In works on web page
- [ ] Expired invite shows friendly error with sharer name
- [ ] Used invite shows friendly error with sharer name
- [ ] Full list shows friendly error
- [ ] Already a member shows message with app links
- [ ] Valid invite creates membership server-side
- [ ] **After acceptance, page shows provider used: "Joined with Google" or "Joined with Apple"**
- [ ] Page offers "Open Zusamn" link
- [ ] Page offers "Install Zusamn" link
- [ ] After app install + login (same provider), shared list appears in switcher

### Account Screen

- [ ] Displays user's display name
- [ ] Logout button is visible and functional
- [ ] Logout clears session and returns to auth screen
- [ ] **Delete Account button is visible**
- [ ] **Delete Account shows confirmation dialog: "Delete Account?" with warning text**
- [ ] **Confirming Delete Account immediately: removes user from all shared lists, deletes personal list if empty, deletes account, logs out**
- [ ] **After deletion, app returns to auth screen**

### Cross-Cutting

- [ ] Works on iOS
- [ ] Works on Android
- [ ] Syncs between multiple devices for same user
- [ ] No push notifications (deferred)
- [ ] No web app (deferred)
- [ ] Localization: German + English fallback only

---

## 9. Out of Scope (Explicitly Deferred)

The following are NOT part of MVP:

- Web app (browsing/editing lists in web UI)
- Creating additional lists (beyond personal default + joined lists)
- Deleting lists (users cannot delete lists; they can only leave shared lists or delete their account)
- Quick Add chips / "single tap add" beyond basic input
- Strict "no duplicates" behavior
- Grouping and drag & drop
- In-list search
- "Updated X minutes ago" indicator
- Marketing website (beyond invite landing page)
- Push notifications
- Account data export
- Full i18n (only German + English in MVP1)
- Conflict resolution dialogs (silent reconciliation only)
- **Activity log or change history** (no "who did what" tracking in MVP1)

---

## 10. Open Questions

All previously identified open questions have been resolved. See Clarifications section.

---

## Assumptions

- Users trust each other within a shared list (no permissions model needed)
- Network connectivity is the exception, not the rule (offline-first mindset)
- Small groups only (max 3 members) is acceptable for MVP
- Server-authoritative conflict resolution with silent reconciliation is acceptable for MVP
- Item deletions always win over offline edits (no zombie items)
- Users have access to either Google or Apple accounts for authentication
- App store approval timelines are outside scope of this spec
- Soft-delete with undo support is required for good UX
- Delete Account must be immediate (no grace period) for App Store compliance
