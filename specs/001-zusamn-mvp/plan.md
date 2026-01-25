# Implementation Plan: Zusamn MVP1

**Branch**: `001-zusamn-mvp` | **Date**: 2026-01-25 | **Spec**: [specs/001-zusamn-mvp/spec.md](./spec.md)
**Input**: Feature specification from `specs/001-zusamn-mvp/spec.md`

## Summary

MVP1 of Zusamn: An offline-first, cross-platform collaborative shopping list app. Core features include a fast personal list, 3-member shared lists via invite links, and a calm, Apple-like UI. Built with React Native (Expo), Firestore (offline SDK), and Tamagui.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React Native (Expo SDK 50+), Firebase JS SDK (v10+), Tamagui (UI), React Navigation.
**Storage**: Firestore (Persistence Enabled), MMKV (Local Config).
**Testing**: Jest (Unit), Manual QA (EAS Build).
**Target Platform**: iOS (15+), Android (10+).
**Project Type**: Mobile Monorepo (TurboRepo).
**Performance Goals**: <100ms interaction latency (optimistic), <3s sync latency.
**Constraints**: Offline-first, Max 3 members/list, Max 200 items/list.
**Scale/Scope**: Small groups, minimal backend logic (Rules + Client).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Gate Question | Pass? |
|---|-----------|---------------|-------|
| 1 | Speed Over Features | Does this add friction to the core flow? Is there a simpler approach? | Yes |
| 2 | Offline-First | Do all affected features work without connectivity? | Yes |
| 3 | Collaboration Without Annoyance | Is sharing safe and lightweight? Small trusted group only? | Yes |
| 4 | Simplicity Over Power | Does this directly improve the core loop, or is it scope creep? | Yes |
| 5 | Calm, Clear Design | Does this follow established patterns? Any novel UI that needs justification? | Yes |
| 6 | Accessible By Default | Touch targets comfortable? Screen readers work? Keyboard support? | Yes |
| 7 | Privacy As Restraint | What data does this require? Is all of it necessary? No dark patterns? | Yes |
| 8 | Focus Protects Quality | Can we ship this well, or are we stretching too thin? | Yes |
| 9 | Boring Over Clever | Is this solution obvious? Does it need significant explanation? | Yes |

**Tradeoffs requiring justification**: None.

## Project Structure

### Documentation (this feature)

```text
specs/001-zusamn-mvp/
├── plan.md              # This file
├── research.md          # Architectural decisions
├── data-model.md        # Firestore schema
├── quickstart.md        # Setup guide
├── contracts/           # Firestore Rules & TS Interfaces
│   ├── firestore.rules
│   └── interfaces.ts
└── checklists/          # QA & Requirements checklists
```

### Source Code

```text
apps/
├── mobile/              # Expo Router app
│   ├── app/
│   ├── src/
│   │   ├── features/    # Feature-based folders
│   │   └── navigation/
│   └── assets/
└── web/                 # Invite landing app

packages/
├── domain/              # Shared types & validators
├── ui/                  # Tamagui components (Design System)
└── firebase/            # Firebase client config & hooks
```

**Structure Decision**: Monorepo with shared packages for Domain/UI to support future Web App expansion (if needed) and clean separation of concerns.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Monorepo | Code sharing (Types/UI) | Difficult to refactor later; low overhead now. |

---

## Execution Plan

**Strategy**: Risk-first. Auth and Deep Links are tackled early due to EAS/Configuration complexity. Offline core loop is prioritized before sharing logic.

### M0: Foundation, Auth & Deep Link Config (High Risk)
**Goal**: Functional "Hello World" with Authentication and Deep Linking capability configured in EAS.
**Risk**: Expo/EAS configuration, Apple/Google Sign-in setup, Native scheme validation.
**Deliverable**: App installs, user logs in, Firestore user doc created, basic Tab navigation exists.

- [ ] **T0.1: Project Init & EAS Configuration**
    - Setup Expo project with TypeScript & Tamagui.
    - Configure EAS Build (Dev Client).
    - **Crucial**: Configure `scheme: "zusamn"` and Associated Domains/App Links early.
    - *Success*: Dev build compiles and installs on device.

- [ ] **T0.2: Firebase & Firestore Setup**
    - Create Firebase Project.
    - Enable Auth (Google, Apple).
    - Enable Firestore.
    - Setup `packages/firebase` with client initialization.
    - *Success*: App connects to Firebase.

- [ ] **T0.3: UI System Scaffold (`packages/ui`)**
    - Implement "House Components": `Screen`, `TopBar`, `TabBar`, `PrimaryButton`, `TextField`.
    - Implement `Component Gallery` screen (Dev only) to verify tokens.
    - *Success*: Gallery screen renders correct typography/colors.

- [ ] **T0.4: Navigation & Auth Flow**
    - Implement `Lists` and `Account` tabs.
    - Implement Login Screen (Google/Apple buttons).
    - Handle Auth state persistence.
    - **Tech Note**: On auth success, ensure `users/{uid}` exists.
    - *Success*: User can login/logout; lands on empty Lists tab.

### M1: The Core Loop (Offline-First)
**Goal**: A fully functional personal shopping list that works offline.
**Risk**: Firestore Security Rules (User/List/Item), Optimistic UI, Sync behavior.
**Deliverable**: Personal list auto-created. Add/Check/Delete items. Undo toast. Offline persistence working. 200 item limit enforcement.

- [ ] **T1.1: Firestore Data Model & Basic Rules**
    - Define Firestore interfaces in `packages/domain`.
    - Deploy initial Firestore Rules (User write own, List read/write if member).
    - *Success*: Rules prevent unauthorized reads.

- [ ] **T1.2: Personal List Creation**
    - Implement `createPersonalList` trigger/logic on first login.
    - Locale check: "Einkaufen" (DE) vs "Shopping" (EN).
    - *Success*: New user immediately sees a list named "Shopping" (or "Einkaufen").

- [ ] **T1.3: List Detail UI - Read & Add**
    - Render items using `ListRow`.
    - Implement `FixedBottomInput` (above keyboard).
    - **Logic**: Ignore empty/whitespace input.
    - **Limit**: Check local item count < 200 before adding.
    - *Success*: Can add items; keyboard stays open; limit error appears at 200.

- [ ] **T1.4: Item Actions (Check, Delete, Undo)**
    - Implement Check/Uncheck (immediate UI update).
    - Implement Delete (Swipe & Long-press).
    - **Logic**: Soft delete (`deleted: true`).
    - Implement `Toast` provider (stacking rules: new toast replaces old; previous delete becomes final and cannot be undone).
    - Implement Undo (5s timer, writes `deleted: false`).
    - *Success*: Deleted item disappears, comes back on Undo.

- [ ] **T1.5: Offline Verification**
    - Test "Airplane Mode" usage.
    - Verify "Offline" status subtitle logic.
    - Verify sync on reconnect.
    - *Success*: Changes made offline persist and sync to console when online.

- [ ] **T1.6: Clear Checked Items**
    - TopBar Overflow menu.
    - Confirmation Dialog: "Clear [N] checked items?" with Cancel/Clear.
    - Bulk soft-delete.
    - Bulk Undo.
    - *Success*: "Clear checked" works with confirmation (showing count) and undo.

### M2: Collaboration & Sharing (High Risk)
**Goal**: Multi-user sync and Invite flow.
**Risk**: Deep link routing, Invite transaction integrity, Security Rules for sharing.
**Deliverable**: Share sheet, Web invite landing page, Invite redemption, List switcher, 3-member limit enforcement.

- [ ] **T2.1: Invite Logic & Transaction**
    - Create `invites` collection rules (including creator membership check).
    - Implement `generateInviteLink` (write to Firestore).
    - Implement `redeemInvite` (client `runTransaction`):
        1. Read invite → assert usedBy == null && expiresAt > now
        2. Read list → assert memberIds.length < 3
        3. Write invite: usedBy = userId, usedAt = serverTimestamp()
        4. Write list: memberIds = arrayUnion(userId)
        5. Create membership doc: alias = invite.inviteAlias
    - **Constraint**: Entire redemption is atomic (all-or-nothing).
    - *Success*: Can create an invite doc (only if member); Transaction fails if list full or invite used/expired.

- [ ] **T2.2: Share Sheet UI**
    - `SheetModal` for sharing.
    - Logic: If members == 3, show list of names (disabled state).
    - Expiry notice text.
    - Generate deep link: `https://[domain]/invite/[token]`.
    - *Success*: Native share sheet opens with correct URL.

- [ ] **T2.3: Web Invite Landing Page (Firebase Hosting)**
    - Minimal HTML/JS page (Option B).
    - Show Share Name + Sharer Info (No email).
    - **Warning near auth buttons**: "Important: Use the same login method in the app to see this list."
    - Auth buttons (Apple/Google).
    - **If existing session**: Show "Continue as [DisplayName]?" with "Use different account" option.
    - Logic: "Already member", "List full", "Expired" checks.
    - **After successful join**: Show "Joined with [Provider]" before CTA buttons.
    - Deep link button: `zusamn://invite/[token]`.
    - *Success*: Web page loads, auths user, attempts to open app.

- [ ] **T2.4: Deep Link Handling (App + Web Fallback)**
    - Invite URL is the web page: `https://[domain]/invite/[token]`.
    - Web page attempts `zusamn://invite/[token]` via JS redirect or button.
    - If app opens → app handles invite.
    - If app doesn't open (timeout/error) → web page shows "Open in App" + "Install" CTAs.
    - Configure Universal Links (iOS) and App Links (Android) to intercept web URL.
    - Handle `zusamn://invite/[token]` route in app navigation.
    - Logic: Check invite status.
      - If `usedBy == currentUser.uid` -> Navigate to List (Success).
      - If `usedBy != null` -> Error "Already used".
      - Else -> Redeem.
    - If not logged in -> Auth -> Redeem.
    - If logged in -> Redeem.
    - *Success*: Clicking link in Simulator opens app and joins list.

- [ ] **T2.5: List Switcher & Renaming**
    - `SheetModal` for switching lists.
    - Sort: Personal first, then Shared (A-Z).
    - Rename Alias (local user only).
    - "Leave List" action (Shared lists only, NOT personal default list).
    - Leave requires ConfirmDialog: "Leave this list? You'll lose access." with Cancel/Leave.
    - *Success*: Can switch between Personal and Shared lists.

### M3: Polish & Account Management
**Goal**: "Calm" UX, animations, and compliance features.
**Risk**: Animation jank, timing tolerances, edge case cleanups.
**Deliverable**: Sinking animation, Remote highlight, Delete Account, Localization (DE/EN), UI refinement.

- [ ] **T3.1: Account Management**
    - Delete Account screen.
    - **Critical**: Immediate deletion (User + Personal List + Memberships).
    - Logout function.
    - *Success*: Account deletion removes data and redirects to Auth.

- [ ] **T3.2: Animations & Timing**
    - Implement "Sink" animation (500ms delay).
    - Implement "Remote Highlight" (2000ms).
    - **Logic**: Defer animations if `Input` has focus.
    - *Success*: UI feels calm; typing isn't interrupted by incoming syncs.

- [ ] **T3.3: Status Indicators**
    - TopBar Subtitle: "Offline" vs "Syncing".
    - Priority rule: Offline > Syncing.
    - *Success*: Indicators appear correctly during network transitions.

- [ ] **T3.4: Localization**
    - Implement simple i18n key/value.
    - Keys for German/English.
    - Verify "Einkaufen" default.
    - *Success*: App switches language based on system settings.

- [ ] **T3.5: Production Readiness**
    - Firestore Indexes (deploy `firestore.indexes.json`).
    - App Icons & Splash Screen.
    - *Success*: No "index missing" errors in logs.

---

## Dependencies

1.  **Firebase Project**: Must be created manually to get config for `google-services.json` / `GoogleService-Info.plist`.
2.  **Apple Developer Account**: Required for Apple Sign-In & Associated Domains capability.
3.  **Google Cloud Console**: Required for Google Sign-In OAuth client IDs.
4.  **EAS Account**: For building dev clients.

---

## Test Plan

### Automated Testing
- **Unit Tests**: `packages/domain` logic (validators, schema parsing).
- **Security Rules**: Emulator suite tests for `firestore.rules` (Critical for enforcing 3-member/delete-wins).

### Manual QA Scenarios (The Matrix)

| Scenario | Steps | Expected Result |
| :--- | :--- | :--- |
| **Offline Add** | Airplane mode -> Add item -> Kill App -> Open App -> Online | Item exists, syncs to server. |
| **Conflict Delete** | User A edits item (offline). User B deletes item (online). User A goes online. | Item disappears (Delete wins). |
| **List Limit** | Try to add 201st item. | Error: "List full (200 items)..." |
| **Member Limit** | Try to invite 4th person. | Share button disabled / Web page says "List full". |
| **Invite Expiry** | Click 8-day old link. | Error: "Invite expired". |
| **Deep Link Fallback** | Uninstall App -> Click Link. | Opens Web Page -> "Install Zusamn". |
| **Typing Deferral** | Focus input. Have User B add item. | No shift in list until input blur/submit. |
| **Account Delete** | Delete Account. Log in again. | New account created (Empty state). |
| **Web Existing Session** | Load invite page while already logged in. | "Continue as [Name]?" prompt appears. |
| **Auth Provider Warning** | View web invite page. | Warning text visible near auth buttons. |
| **Provider Confirmation** | Complete web invite accept. | "Joined with [Provider]" shown before CTAs. |
| **Leave Personal List** | Try to leave personal list. | "Leave List" not available in overflow menu. |
| **Undo Second Delete** | Delete item A, delete item B (within 5s), tap undo. | A gone (final), B restored. |
| **Undo After Sync** | Delete item, wait for sync to complete, tap undo within 5s. | Item restored (undelete sent to server). |
| **Invite by Non-Member** | (Security test) Attempt to create invite for list you're not in. | Request rejected by Firestore rules. |

---

## Open Questions (Blockers)

(None - "Max 3 lists" constraint removed per review as not in spec).
