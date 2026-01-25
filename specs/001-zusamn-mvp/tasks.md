# Tasks: Zusamn MVP1

**Input**: Design documents from `/specs/001-zusamn-mvp/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Manual QA per plan.md Test Plan. Automated Firestore rules tests included in setup.

**Organization**: Tasks grouped by user story priority for independent delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3, US4)
- Exact file paths included

## Path Conventions (Mobile Monorepo)

```text
apps/mobile/              # Expo Router app
  app/                    # Expo Router routes
  src/
    features/             # Feature modules
    hooks/                # Shared hooks
    providers/            # Context providers
packages/
  domain/                 # Shared types & validators
  ui/                     # Tamagui components
  firebase/               # Firebase config & hooks
apps/web/                 # Minimal invite landing page (repurposed web app)
```

---

## Phase 1: Setup (Project Infrastructure)

**Purpose**: Monorepo initialization, EAS configuration, Firebase project setup

- [ ] T001 Create TurboRepo monorepo with apps/mobile, apps/web, packages/domain, packages/ui, packages/firebase
- [ ] T002 Initialize Expo project in apps/mobile with TypeScript and scheme "zusamn"
- [ ] T003 [P] Configure EAS Build for iOS and Android dev clients in apps/mobile/eas.json
- [ ] T004 [P] Configure Associated Domains (iOS) and App Links (Android) in apps/mobile/app.json
- [ ] T005 [P] Create Firebase project, enable Auth (Google, Apple), enable Firestore
- [ ] T006 [P] Add google-services.json and GoogleService-Info.plist to apps/mobile
- [ ] T007 Setup packages/firebase with Firebase client initialization in packages/firebase/src/index.ts
- [ ] T008 [P] Configure Tamagui in packages/ui with design tokens from docs/ui.md
- [ ] T009 [P] Setup MMKV in apps/mobile for local config storage

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST complete before ANY user story

**CRITICAL**: No user story work can begin until this phase is complete

### Domain Types & Validation

- [ ] T010 [P] Create User interface in packages/domain/src/types/user.ts
- [ ] T011 [P] Create List interface in packages/domain/src/types/list.ts
- [ ] T012 [P] Create Membership interface in packages/domain/src/types/membership.ts
- [ ] T013 [P] Create Item interface in packages/domain/src/types/item.ts
- [ ] T014 [P] Create Invite interface in packages/domain/src/types/invite.ts
- [ ] T015 Create validators (text 100 chars, alias 50 chars, locale) in packages/domain/src/validators.ts

### Firestore Rules & Indexes

- [ ] T016 Deploy Firestore security rules from specs/001-zusamn-mvp/contracts/firestore.rules
- [ ] T017 [P] Create Firestore rules emulator tests in packages/firebase/tests/rules.test.ts
- [ ] T018 [P] Deploy Firestore indexes from specs/001-zusamn-mvp/contracts/firestore.indexes.json

### UI House Components

- [ ] T019 [P] Create Screen component in packages/ui/src/Screen.tsx
- [ ] T020 [P] Create TopBar component (title, subtitle, actions) in packages/ui/src/TopBar.tsx
- [ ] T021 [P] Create TabBar component (Lists, Account tabs) in packages/ui/src/TabBar.tsx
- [ ] T022 [P] Create PrimaryButton component in packages/ui/src/PrimaryButton.tsx
- [ ] T023 [P] Create GhostButton component in packages/ui/src/GhostButton.tsx
- [ ] T024 [P] Create TextField component in packages/ui/src/TextField.tsx
- [ ] T025 [P] Create Toast component with 5s timer and dismiss logic in packages/ui/src/Toast.tsx
- [ ] T026 [P] Create ConfirmDialog component in packages/ui/src/ConfirmDialog.tsx
- [ ] T027 [P] Create SheetModal component in packages/ui/src/SheetModal.tsx
- [ ] T028 [P] Create Separator component in packages/ui/src/Separator.tsx
- [ ] T029 [P] Create EmptyState component in packages/ui/src/EmptyState.tsx
- [ ] T030 Create Component Gallery screen (dev only) in apps/mobile/app/(dev)/gallery.tsx

### Authentication Infrastructure

- [ ] T031 Create AuthProvider context in apps/mobile/src/providers/AuthProvider.tsx
- [ ] T032 [P] Create useAuth hook in packages/firebase/src/hooks/useAuth.ts
- [ ] T033 Create Login screen with Google/Apple buttons in apps/mobile/app/(auth)/login.tsx
- [ ] T034 Implement display name prompt flow if social login lacks first name in apps/mobile/app/(auth)/display-name.tsx
- [ ] T035 Create auth state persistence using Firebase onAuthStateChanged in packages/firebase/src/auth.ts

### Navigation Shell

- [ ] T036 Create root layout with auth guard in apps/mobile/app/_layout.tsx
- [ ] T037 Create tab layout (Lists, Account) in apps/mobile/app/(tabs)/_layout.tsx
- [ ] T038 Create placeholder Lists tab screen in apps/mobile/app/(tabs)/index.tsx
- [ ] T039 Create placeholder Account tab screen in apps/mobile/app/(tabs)/account.tsx

**Checkpoint**: Foundation ready - user story implementation can begin

---

## Phase 3: User Story 1 - Personal List Core Loop (Priority: P1) - MVP

**Goal**: User can sign up, get a personal list, add/check/delete items offline, with undo support

**Independent Test**: New user → login → add 3 items → check 1 → delete 1 → undo → verify 3 items exist. Works offline.

**Covers**: Journeys 1, 2, 3 from spec.md

### Firebase Hooks for US1

- [ ] T040 [US1] Create useUser hook (get/create user doc) in packages/firebase/src/hooks/useUser.ts
- [ ] T041 [US1] Create useList hook (get list by ID) in packages/firebase/src/hooks/useList.ts
- [ ] T042 [US1] Create useItems hook (realtime listener, filter deleted) in packages/firebase/src/hooks/useItems.ts
- [ ] T043 [US1] Create useMembership hook (get user's alias for list) in packages/firebase/src/hooks/useMembership.ts

### Personal List Creation

- [ ] T044 [US1] Implement createPersonalList logic with locale check in packages/firebase/src/services/listService.ts
- [ ] T045 [US1] Integrate personal list creation on first login in apps/mobile/src/providers/AuthProvider.tsx
- [ ] T046 [US1] Store last-used listId in MMKV in apps/mobile/src/hooks/useLastUsedList.ts

### List Detail UI Components

- [ ] T047 [P] [US1] Create ListRow component (checkbox, text, checked styling) in packages/ui/src/ListRow.tsx
- [ ] T048 [P] [US1] Create FixedBottomInput component (above keyboard) in packages/ui/src/FixedBottomInput.tsx
- [ ] T049 [P] [US1] Create OverflowMenu component (TopBar "...") in packages/ui/src/OverflowMenu.tsx

### List Detail Screen

- [ ] T050 [US1] Create List Detail screen layout in apps/mobile/app/(tabs)/index.tsx
- [ ] T051 [US1] Implement item list rendering with FlatList in apps/mobile/src/features/list/ItemList.tsx
- [ ] T052 [US1] Implement item ordering (unchecked newest-first, checked at bottom) in apps/mobile/src/features/list/useItemOrdering.ts

### Add Item Flow

- [ ] T053 [US1] Implement addItem service (validate 100 chars, check 200 limit) in packages/firebase/src/services/itemService.ts
- [ ] T054 [US1] Integrate FixedBottomInput with addItem, ignore whitespace, keep keyboard open in apps/mobile/src/features/list/AddItemInput.tsx
- [ ] T055 [US1] Show 200-item limit error inline in apps/mobile/src/features/list/AddItemInput.tsx

### Check/Uncheck Flow

- [ ] T056 [US1] Implement toggleItemChecked service in packages/firebase/src/services/itemService.ts
- [ ] T057 [US1] Add check/uncheck tap handler to ListRow in apps/mobile/src/features/list/ItemList.tsx

### Delete Flow with Undo

- [ ] T058 [US1] Implement softDeleteItem service in packages/firebase/src/services/itemService.ts
- [ ] T059 [US1] Implement undeleteItem service in packages/firebase/src/services/itemService.ts
- [ ] T060 [US1] Add swipe-left delete gesture to ListRow in apps/mobile/src/features/list/SwipeableListRow.tsx
- [ ] T061 [US1] Add long-press delete context menu to ListRow in apps/mobile/src/features/list/SwipeableListRow.tsx
- [ ] T062 [US1] Create ToastProvider with undo stacking rules (replace old, finalize previous) in apps/mobile/src/providers/ToastProvider.tsx
- [ ] T063 [US1] Integrate delete → toast → undo flow in apps/mobile/src/features/list/ItemList.tsx

### Clear Checked Flow

- [ ] T064 [US1] Implement bulkSoftDelete service for checked items in packages/firebase/src/services/itemService.ts
- [ ] T065 [US1] Add "Clear checked" to overflow menu with confirmation count in apps/mobile/src/features/list/ListDetailScreen.tsx
- [ ] T066 [US1] Integrate bulk delete → toast → bulk undo in apps/mobile/src/features/list/ListDetailScreen.tsx

### Offline Status Indicators

- [ ] T067 [US1] Create useNetworkStatus hook in apps/mobile/src/hooks/useNetworkStatus.ts
- [ ] T068 [US1] Create useSyncStatus hook (pending writes) in packages/firebase/src/hooks/useSyncStatus.ts
- [ ] T069 [US1] Show "Offline" or "Syncing" subtitle in TopBar (Offline > Syncing priority) in apps/mobile/src/features/list/ListDetailScreen.tsx

**Checkpoint**: User Story 1 complete. Personal list fully functional offline.

---

## Phase 4: User Story 2 - Sharing & Collaboration (Priority: P2)

**Goal**: User can share list, invitee can join via web or app, multi-user sync works

**Independent Test**: User A shares list → User B accepts via web → both see each other's changes in realtime

**Covers**: Journeys 4, 5, 6 from spec.md

### Invite Services

- [ ] T070 [US2] Implement generateInvite service (create invite doc, check member count) in packages/firebase/src/services/inviteService.ts
- [ ] T071 [US2] Implement redeemInvite transaction (atomic: check limits, mark used, add member, create membership) in packages/firebase/src/services/inviteService.ts
- [ ] T072 [US2] Create useInvite hook (get invite by token) in packages/firebase/src/hooks/useInvite.ts

### Share Sheet UI

- [ ] T073 [P] [US2] Create ShareSheet component in packages/ui/src/ShareSheet.tsx
- [ ] T074 [US2] Implement share name field with locale default in apps/mobile/src/features/sharing/ShareSheetContent.tsx
- [ ] T075 [US2] Show "Link expires in 7 days" notice in apps/mobile/src/features/sharing/ShareSheetContent.tsx
- [ ] T076 [US2] Show disabled state with member names when list full (3 members) in apps/mobile/src/features/sharing/ShareSheetContent.tsx
- [ ] T077 [US2] Integrate OS share sheet and "Link shared" toast in apps/mobile/src/features/sharing/ShareSheetContent.tsx

### Web Invite Landing Page

- [ ] T078 [P] [US2] Create minimal HTML structure in apps/web/index.html
- [ ] T079 [P] [US2] Add Firebase Auth JS SDK (Google, Apple) in apps/web/src/auth.js
- [ ] T080 [US2] Display share name and sharer info (no email) in apps/web/src/invite.js
- [ ] T081 [US2] Add auth provider warning near buttons in apps/web-invite/src/invite.js
- [ ] T082 [US2] Implement existing session check ("Continue as [Name]?") in apps/web-invite/src/invite.js
- [ ] T083 [US2] Implement invite validation (expired, used, full, already member) in apps/web-invite/src/invite.js
- [ ] T084 [US2] Implement invite redemption call in apps/web-invite/src/invite.js
- [ ] T085 [US2] Show "Joined with [Provider]" after success in apps/web-invite/src/invite.js
- [ ] T086 [US2] Add "Open Zusamn" and "Install Zusamn" buttons in apps/web-invite/src/invite.js
- [ ] T087 [US2] Deploy web invite page to Firebase Hosting

### Deep Link Handling (App)

- [ ] T088 [US2] Configure Expo Router linking for zusamn://invite/[token] in apps/mobile/app.json
- [ ] T089 [US2] Create invite handling screen in apps/mobile/app/invite/[token].tsx
- [ ] T090 [US2] Implement invite redemption flow (auth if needed, validate, redeem) in apps/mobile/src/features/invite/InviteHandler.tsx
- [ ] T091 [US2] Show error states (expired, used, full) in apps/mobile/src/features/invite/InviteHandler.tsx
- [ ] T092 [US2] Navigate to joined list on success in apps/mobile/src/features/invite/InviteHandler.tsx

### Remote Sync & Highlights

- [ ] T093 [US2] Track remote changes in useItems hook in packages/firebase/src/hooks/useItems.ts
- [ ] T094 [US2] Implement remote highlight animation (2000ms) in ListRow in packages/ui/src/ListRow.tsx
- [ ] T095 [US2] Implement checked item sink animation (500ms delay) in apps/mobile/src/features/list/ItemList.tsx
- [ ] T096 [US2] Defer animations while input has focus in apps/mobile/src/features/list/ItemList.tsx

**Checkpoint**: User Story 2 complete. Multi-user collaboration works.

---

## Phase 5: User Story 3 - Multi-List Management (Priority: P3)

**Goal**: User can switch between lists, rename aliases, leave shared lists

**Independent Test**: User with 2+ lists → switch lists → rename alias → leave one shared list → verify

**Covers**: Journeys 7, 8, 11 from spec.md

### List Switcher

- [ ] T097 [US3] Create useUserLists hook (personal + shared, sorted) in packages/firebase/src/hooks/useUserLists.ts
- [ ] T098 [P] [US3] Create ListSwitcherSheet component in packages/ui/src/ListSwitcherSheet.tsx
- [ ] T099 [US3] Implement list switcher UI (personal first, shared A-Z, shared icon) in apps/mobile/src/features/list/ListSwitcher.tsx
- [ ] T100 [US3] Make TopBar title tappable to open switcher in apps/mobile/src/features/list/ListDetailScreen.tsx
- [ ] T101 [US3] Persist last-used list selection in MMKV in apps/mobile/src/features/list/ListSwitcher.tsx

### Rename Alias

- [ ] T102 [US3] Implement updateAlias service in packages/firebase/src/services/membershipService.ts
- [ ] T103 [US3] Add rename action (long-press or edit icon) to list switcher in apps/mobile/src/features/list/ListSwitcher.tsx
- [ ] T104 [US3] Create rename sheet with 50-char limit in apps/mobile/src/features/list/RenameAliasSheet.tsx

### Leave Shared List

- [ ] T105 [US3] Implement leaveList service (remove membership, remove from memberIds) in packages/firebase/src/services/listService.ts
- [ ] T106 [US3] Add "Leave List" to overflow menu (shared lists only) in apps/mobile/src/features/list/ListDetailScreen.tsx
- [ ] T107 [US3] Hide "Leave List" for personal default list in apps/mobile/src/features/list/ListDetailScreen.tsx
- [ ] T108 [US3] Show confirmation dialog "Leave this list? You'll lose access." in apps/mobile/src/features/list/ListDetailScreen.tsx
- [ ] T109 [US3] Navigate to personal list after leaving in apps/mobile/src/features/list/ListDetailScreen.tsx

**Checkpoint**: User Story 3 complete. Full list management works.

---

## Phase 6: User Story 4 - Account Management (Priority: P4)

**Goal**: User can logout, delete account (App Store compliance)

**Independent Test**: User → Account tab → logout → re-login → same data. Delete account → re-login → empty state.

**Covers**: Journeys 9, 10 from spec.md

### Account Screen

- [ ] T110 [US4] Create Account screen layout with display name in apps/mobile/app/(tabs)/account.tsx
- [ ] T111 [US4] Implement logout button and signOut call in apps/mobile/app/(tabs)/account.tsx

### Delete Account

- [ ] T112 [US4] Implement deleteAccount service (remove memberships, soft-delete personal list, delete user doc, sign out) in packages/firebase/src/services/accountService.ts
- [ ] T113 [US4] Add Delete Account button to Account screen in apps/mobile/app/(tabs)/account.tsx
- [ ] T114 [US4] Show confirmation dialog with warning text in apps/mobile/app/(tabs)/account.tsx
- [ ] T115 [US4] Require online for delete account, show error if offline in apps/mobile/app/(tabs)/account.tsx
- [ ] T116 [US4] Navigate to auth screen after deletion in apps/mobile/app/(tabs)/account.tsx

**Checkpoint**: User Story 4 complete. Account compliance features done.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Animations, localization, production readiness

### Localization

- [ ] T117 [P] Create i18n system with DE/EN strings in packages/domain/src/i18n/index.ts
- [ ] T118 [P] Add localized strings for all UI text in packages/domain/src/i18n/strings.ts
- [ ] T119 Integrate locale detection and string lookup in apps/mobile/src/hooks/useLocale.ts

### Animation Polish

- [ ] T120 Verify sink animation timing (500ms ±100ms) in apps/mobile/src/features/list/ItemList.tsx
- [ ] T121 Verify remote highlight timing (2000ms ±200ms) in packages/ui/src/ListRow.tsx
- [ ] T122 Add subtle animation to checked item visual distinction in packages/ui/src/ListRow.tsx

### Production Readiness

- [ ] T123 [P] Add app icons for iOS and Android in apps/mobile/assets/
- [ ] T124 [P] Create splash screen in apps/mobile/assets/
- [ ] T125 Configure production Firebase config in apps/mobile
- [ ] T126 Create EAS production build profile in apps/mobile/eas.json
- [ ] T127 Run full Manual QA Scenarios from plan.md Test Plan

### Documentation

- [ ] T128 [P] Update CLAUDE.md with final project structure
- [ ] T129 [P] Validate quickstart.md setup instructions

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ─────────────────────────────┐
                                             │
Phase 2 (Foundational) ──────────────────────┤ BLOCKS ALL USER STORIES
                                             │
         ┌───────────────────────────────────┘
         │
         ├── Phase 3 (US1: Core Loop) ─── MVP COMPLETE
         │         │
         │         └── Phase 4 (US2: Sharing) ── needs US1 list infrastructure
         │                   │
         │                   └── Phase 5 (US3: List Management) ── needs US2 sharing
         │
         └── Phase 6 (US4: Account) ─── can start after Phase 2, parallel with US1-3
                                             │
Phase 7 (Polish) ────────────────────────────┘ depends on all stories
```

### User Story Dependencies

| Story | Depends On | Can Parallelize With |
|-------|------------|---------------------|
| US1 (Core Loop) | Phase 2 only | US4 (Account) |
| US2 (Sharing) | US1 (list infrastructure) | - |
| US3 (List Management) | US2 (multi-list from sharing) | - |
| US4 (Account) | Phase 2 only | US1, US2, US3 |

### Parallel Opportunities Per Phase

**Phase 1**: T003, T004, T005, T006, T008, T009 can all run in parallel

**Phase 2**:
- All domain types (T010-T014) in parallel
- All UI components (T019-T029) in parallel
- Rules deploy + tests (T016-T018) in parallel

**Phase 3 (US1)**:
- All Firebase hooks (T040-T043) in parallel
- All UI components (T047-T049) in parallel

**Phase 4 (US2)**:
- Web invite setup (T078-T079) parallel with app share sheet

**Phase 7**: Most polish tasks can run in parallel

---

## Parallel Example: Phase 2 UI Components

```bash
# Launch all house components in parallel:
Task: "Create Screen component in packages/ui/src/Screen.tsx"
Task: "Create TopBar component in packages/ui/src/TopBar.tsx"
Task: "Create TabBar component in packages/ui/src/TabBar.tsx"
Task: "Create PrimaryButton component in packages/ui/src/PrimaryButton.tsx"
Task: "Create GhostButton component in packages/ui/src/GhostButton.tsx"
Task: "Create TextField component in packages/ui/src/TextField.tsx"
Task: "Create Toast component in packages/ui/src/Toast.tsx"
Task: "Create ConfirmDialog component in packages/ui/src/ConfirmDialog.tsx"
Task: "Create SheetModal component in packages/ui/src/SheetModal.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (Core Loop)
4. **STOP and VALIDATE**: Test offline add/check/delete/undo
5. Deploy internal build for testing

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Personal list works offline → **MVP!**
3. Add US2 → Multi-user sharing works → Demo collaboration
4. Add US3 → Multi-list management → Full list features
5. Add US4 → Account management → App Store ready
6. Polish → Production ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to user story for traceability
- Each user story is independently testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story
- All tasks must align with Zusamn Constitution (see plan.md)

## Task Count Summary

| Phase | Task Count |
|-------|------------|
| Phase 1: Setup | 9 |
| Phase 2: Foundational | 30 |
| Phase 3: US1 Core Loop | 30 |
| Phase 4: US2 Sharing | 27 |
| Phase 5: US3 List Management | 13 |
| Phase 6: US4 Account | 7 |
| Phase 7: Polish | 13 |
| **Total** | **129** |

| User Story | Task Count | Independent Test |
|------------|------------|------------------|
| US1 (Core Loop) | 30 | Add/check/delete/undo offline |
| US2 (Sharing) | 27 | Share → web accept → realtime sync |
| US3 (List Management) | 13 | Switch/rename/leave lists |
| US4 (Account) | 7 | Logout/delete account |
