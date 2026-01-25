# UI.md — Zusamn UI Guidelines (MVP1 / First Versions)
**Goal:** A minimal, calm, iOS-like UI that stays consistent even when built by coding agents.  
**Non-goal:** A playful or “template-y” aesthetic. No heavy shadows, gradients, or dense controls.

---

## 1) Product UI Principles (Derived from Constitution)
1. **Speed over features:** UI must feel instant; avoid modal stacks and slow flows.
2. **Calm, clear design:** whitespace, subtle separators, predictable patterns.
3. **Collaboration without annoyance:** in-app awareness beats notification spam.
4. **Accessible by default:** accessibility is a design constraint from day one.

---

## 2) Visual Language (MVP1)
### Overall feel
- Closest reference: **Apple Reminders** list detail (clean rows, subtle separators, calm hierarchy).
- Use **system font** (native look).
- Use **semantic colors** (background/surface/text/separator/accent).

### Things we explicitly avoid (MVP1)
- Card-heavy layouts
- Busy iconography
- Decorative gradients
- Strong drop shadows
- Multiple accent colors
- Dense settings screens

### Cross-platform behavior (important)
- Follow **platform-native conventions** for sheets, share actions, and haptics.
- Do not force iOS visual styling onto Android.
- Use the **platform-native share sheet**; do not build custom share UI.
- Status bar content color must match the current theme (light/dark).

---

## 3) Design Tokens (MVP1)
> Use these values consistently across screens and components. Screens must not invent new spacing/typography values.

### Typography scale
- **Screen title:** 20, semibold
- **Row text (primary):** 17, regular
- **Secondary text / helper:** 13, regular (muted)
- **Section label:** 13, semibold (muted)

### Spacing
- **Screen padding:** 16
- **Row horizontal padding:** 16
- **Row vertical padding:** 12
- **Element gap:** 8
- **Sheet padding:** 16

### Radii
- **Sheet radius:** 16
- **Button radius:** 12
- **Input radius:** 12

### Icons (standardized)
- **Standard actions:** 24px
- **Small indicators:** 16px

### Focus (keyboard + accessibility)
- `focusRingWidth`: 2
- `focusRingOffset`: 2

### Animation
- `checkSinkDuration`: 500ms (±100ms tolerance)
- `remoteHighlightDuration`: 2000ms (±200ms tolerance)

> **Reduce motion:** Honor system “Reduce Motion” preference; skip non-essential animations (sink/highlight) when enabled.

### Tap target & accessibility
- **Minimum touch target:** 44px
- Avoid tiny icons without padding.
- Text must remain readable at system larger text sizes.

### Dynamic type rules (explicit)
- Row text: wraps to **2 lines max**, then truncates with ellipsis.
- TopBar title (alias): **single line**, truncates with ellipsis.
- Screen titles: scale with system size but **do not wrap**.
- Add-item input must grow vertically as needed (no clipping at accessibility text sizes).

### Color semantics (names, not hex)
- `bg` — system background
- `surface` — secondary background (lists/sheets)
- `text` — primary text
- `textMuted` — secondary text (helpers/status)

  **Important:** `textMuted` MUST still meet **WCAG AA 4.5:1** contrast against both `bg` and `surface`
  (secondary text must remain readable at 13pt).

- `separator` — hairline separator color
- `accent` — primary accent (iOS-ish blue)
- `danger` — destructive actions (delete)

**Contrast (global):** All text/background combinations MUST meet **WCAG AA**
- 4.5:1 for body text
- 3:1 for large text and icons

---

## 4) Component System Rules (Most Important)
To avoid UI drift:
- **Screens MUST only compose from `packages/ui` components** + layout primitives.
- **No ad-hoc styling in screens.** If you need a new style, add/extend a component.
- **Any new shared component must be added to the Component Gallery screen.**

---

## 5) Required “House Components” (MVP1)
These components live in `packages/ui` and must be used by MVP screens.

### 5.1 `Screen`
Consistent padding, background, safe area behavior.

### 5.2 `TopBar`
Header pattern:
- Center: list alias title (tappable)
- Subtitle under title (calm status): Offline / Syncing
- Right actions vary by screen (Share, overflow)

### 5.3 `TabBar`
Bottom navigation with exactly **2 tabs**:
- **Lists**
- **Account**

### 5.4 `ListRow`
Core item row with:
- Checkbox
- Label
- Subtle separator
- Highlight state for remote changes
- Checked styling (muted text; optional subtle strike)

**Accessibility semantics (required):**
- Checkbox must expose role=checkbox with checked state to screen readers.
- Row must announce: item label + checked/unchecked.
- Row MUST expose a native accessibility action for **Delete**
  (e.g., iOS accessibility actions / TalkBack actions) so deletion is possible without gestures.

### 5.5 `TextField`
Used for:
- Add-item input
- Rename alias
- Share-name input
- Inline error message rendering (e.g., list full)

### 5.6 `PrimaryButton` and `GhostButton`
- Primary for commit actions (Share, Join, Save).
- Ghost for secondary actions.

### 5.7 `SheetModal`
Standard bottom sheet wrapper:
- List switcher
- Share flow
- Rename alias
- Share-disabled explanation sheet

### 5.8 `Toast`
Standard toast for:
- Undo delete (single item)
- Undo clear checked (bulk)
- “Link shared” confirmation

Placement (required):
- Toasts MUST appear **above the keyboard (if open)** and **above the TabBar**.

Accessibility (required):
- Toasts MUST be announced as a polite live region (`aria-live="polite"` / equivalent).
- Undo action MUST be focusable and reachable via VoiceOver/TalkBack navigation.
- Toast dismissal (timeout or replaced by a new toast) should be perceivable to screen reader users.
- Toasts must not steal focus from the user’s current control (announce, don’t interrupt).

### 5.9 `ConfirmAction` (Native)
Standard destructive confirmation pattern.

Implementation requirements:
- **iOS:** Use native **ActionSheet** (bottom sheet with destructive red action)
- **Android:** Use native **Alert Dialog** (or native bottom sheet equivalent)

Used for:
- Clear checked confirmation
- Leave list confirmation
- Delete account confirmation

### 5.10 `EmptyState`
Calm empty list guidance:
- “Add your first item…”

### 5.11 `Separator`
Consistent hairline divider.

---

## 6) Navigation & Screens (MVP1)

### 6.1 Tab Bar Structure
- **Lists tab** (default):
  - Opens the **last-used List Detail**.
  - On first run: opens personal default list.
- **Account tab**:
  - Shows Logout + Delete Account.

---

## 7) List Detail Screen (Main Screen)

### 7.1 Layout
- **TopBar**
  - Title: list alias (tappable)
  - Subtitle (when relevant):
    - **Offline** — shown when device lacks connectivity
    - **Syncing** — shown when local changes are pending upload or uploading
    - **Priority:** “Offline” takes precedence over “Syncing” if both conditions apply

  Accessibility (required):
  - Subtitle changes (Offline/Syncing) MUST trigger a screen reader announcement
    (polite, non-focus-stealing).

  - Right actions:
    - Share (enabled/disabled depending on member count)
    - Overflow (“…”)

- **List switcher affordance**
  - Tapping the **list alias title** (center) opens the **List Switcher** sheet.
  - There is **no separate “switch list” button**.

- **Add-item input**
  - Fixed input at **bottom of screen**.
  - When keyboard is active, input stays **above keyboard**.
  - Return/Enter submits.

- **Items list**
  - Unchecked section (top)
  - Checked section (bottom)
  - Checked items remain visible at the bottom.

**Focus order (accessibility):**
1. TopBar actions (left to right)
2. Add-item input
3. Items list (top to bottom: unchecked, then checked)

### 7.2 Add item behavior
- Pressing Return/Enter with non-empty text:
  - creates item
  - clears input
  - keyboard remains open
- Submitting empty or whitespace-only text:
  - does nothing silently (no error)

**200-item limit UI (explicit):**
- If list already has 200 items:
  - show inline error below input: **“List full (200 items). Clear checked items to add more.”**
  - input remains visible (user can still clear/delete items)

### 7.3 Check/uncheck behavior
- Single tap toggles checked state quickly.
- Checked item sinks after `checkSinkDuration` (500ms ±100ms) with subtle animation.

### 7.4 Remote change highlights
- Remote-changed items highlight for `remoteHighlightDuration` (2000ms ±200ms) if visible.
- While add-item input has focus:
  - defer remote highlight effects and sinking animations
  - apply deferred effects when focus is lost or user submits

### 7.5 Delete behavior + undo rules
Deletion affordances:
- **Swipe-left**
  - partial swipe reveals Delete action
  - if user swipes further (“full swipe”), the item is deleted
- **Long-press**
  - shows a minimal action menu with **Delete** (single action)
  - tapping Delete deletes item

Both gestures result in immediate deletion followed by 5-second Undo toast.

Accessibility notes (required):
- ListRow MUST expose a native accessibility action for **Delete** so it is discoverable without gestures.
- Long-press remains a supported non-swipe path; for screen readers, Delete must be clearly labeled as **“Delete [item name]”**.

Undo:
- After delete, show Undo toast for 5 seconds.
- If a new delete occurs while an undo toast is visible:
  - dismiss previous toast (previous delete becomes final)
  - show new undo toast for latest delete

### 7.6 Clear checked (bulk destructive)
- Available only in TopBar overflow (“…”) and only if checked items exist.
- Requires **ConfirmAction**:
  - **“Clear [N] checked items?”** with actions **Cancel / Clear**
- After clear, show toast **“Checked items cleared”** with Undo action.

### 7.7 Overflow menu contents (MVP1)
- Clear checked (if any checked items exist)
- Leave list (shared lists only)
- (No list deletion UI)

### 7.8 Leave shared list
- Shared lists only:
  - Overflow menu provides “Leave list”
  - Requires **ConfirmAction**:
    - **“Leave this list? You’ll lose access.”** actions **Cancel / Leave**
  - After leaving, list disappears from switcher immediately
- Personal default list cannot be left in MVP1.

### 7.9 Share action
- If list has < 3 members:
  - Share enabled → opens Share sheet
- If list has 3 members:
  - Share disabled (grayed)
  - Tapping shows:
    - “This list has 3 members: Name1, Name2, Name3”

### 7.10 Keyboard dismissal (explicit)
- Tapping outside the input dismisses the keyboard.
- If an external keyboard is used, **Escape** dismisses input focus when applicable.

---

## 8) List Switcher (Sheet)

### 8.1 Layout
- Title: “Lists”
- List rows show:
  - Alias
  - Shared icon if shared
- Tap selects list and closes sheet.

### 8.2 Ordering
- Personal default list first.
- Shared lists below, alphabetical by alias.

### 8.3 Per-list actions
- Rename alias (“Rename for me”) available via long-press or row action.

---

## 9) Rename Alias (Sheet)
- Title: “Rename list”
- TextField prefilled with current alias
- Save / Cancel
- Alias is per-user only; does not affect others.
- Enforce 50-character limit; truncate display as needed.

---

## 10) Share Flow (Sheet)

### 10.1 Layout
- Title: “Share”
- TextField: “Share name” (prefilled suggestion)
- PrimaryButton: “Share link”
- Note (muted): **“Link expires in 7 days”**

### 10.2 Behavior
- Share name suggestion uses locale:
  - German: “<FirstName> – Einkaufen”
  - English fallback: “<FirstName> – Shopping”
- After OS share sheet completes/dismisses:
  - show toast: “Link shared”

---

## 11) Invite Landing/Accept Page (Web, Minimal)
**Not a web app.** Invite acceptance only.

### 11.1 Core content
- Sharer display name + avatar (if available) or initials (never email)
- Warning: “Important: Use the same login method in the app to see this list.”
- Auth buttons: Apple + Google
- After acceptance:
  - show “Joined with Apple/Google”
  - show “Open Zusamn” / “Install Zusamn” CTA

### 11.2 Existing web session handling
- If browser already authenticated as a Zusamn user:
  - show “Continue as [Name]” and “Use different account” before accepting invite.

### 11.3 Deep link fallback
- If deep link fails to open app, the invite URL must load this web page with “Open in app / Install” CTAs prominently.

---

## 12) Account Screen (MVP1)
Minimal “normal app” account page.

- Display name (and optionally auth provider)
- Logout button
- Delete Account button (destructive; confirmation required)

Delete Account confirmation copy must be explicit:
- “This permanently deletes your account and removes you from all lists.”

Delete Account requires **ConfirmAction**:
- iOS ActionSheet, Android Alert Dialog.

---

## 13) Interaction Patterns (MVP1)
- Prefer Sheets over full-screen modals.
- Avoid nested sheets.
- Single-item destructive actions:
  - no confirmation (use Undo)
- Bulk destructive actions:
  - confirmation required via **ConfirmAction** (Clear checked, Delete Account, Leave list)

**Motion (required):**
- Respect prefers-reduced-motion. If enabled:
  - skip “sinking” animations and snap immediately
  - do not animate highlight transitions (use non-animated visual state if needed)

---

## 14) i18n / Localization (MVP1)
- Support German (priority) + English fallback for core strings:
  - default personal list name: “Einkaufen” if locale starts with “de”, else “Shopping”
  - share suggestion localized (“<FirstName> – Einkaufen/Shopping”)
- Assume German strings may be ~30% longer than English:
  - buttons must tolerate longer labels without clipping
  - truncate where specified (TopBar title, long aliases)

---

## 15) UI Quality Bar (Definition of Done)
- No custom spacing/typography in screens (uses tokens + house components).
- Tap targets meet 44px minimum.
- Contrast meets WCAG AA (including `textMuted` at 13pt).
- Clear checked requires ConfirmAction with count.
- Share disabled shows member names.
- List detail smooth with up to 200 items.
- Toasts and confirmations are accessible (announced, focusable actions).
- TopBar subtitle changes are announced (Offline/Syncing).
- Reduce motion honored.
- Component Gallery updated for any shared component change/addition.

---

## 16) Component Gallery (Required)
Dev-only screen that renders:
- Buttons (primary/ghost)
- TextField states (normal/focused/error/disabled, incl. 200-item limit error)
- ListRow (checked/unchecked/highlight; with accessibility actions)
- SheetModal examples
- Toast + Undo examples (incl. focusable Undo; placement above keyboard)
- ConfirmAction examples (iOS ActionSheet style, Android Alert Dialog style)
- Separators and EmptyState
  in both light/dark mode (if supported early).

This is the canonical reference for UI consistency.