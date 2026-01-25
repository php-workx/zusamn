# Zusamn Idea Ledger (Living Document)
**Last updated:** 2026-01-25  
**Purpose:** A persistent record of product ideas, decisions, constraints, and open questions.  
**Rule:** Nothing in this ledger is automatically “in scope.” Only items promoted into an active spec become requirements.

---

## 0) Snapshot (Where We Are Today)

### Product one-liner
A calm, offline-first, collaborative shopping list that feels iOS-native and syncs across iOS, Android, and Web.

### Current chosen stack (decision)
- Expo (React Native) + Expo Web
- Tamagui (iOS-ish UI system)
- Firebase (Auth + Firestore + Functions)
- Monorepo recommended: Turborepo + pnpm

### Core collaboration philosophy (decision)
Small trusted groups. No owner. Equal members.

---

## 1) Vision, Goals, Non-Goals (Stable)

### Goals
- **Speed over features:** core loop feels instant.
- **Offline-first:** core actions never blocked by connectivity.
- **Collaboration without annoyance:** safe sharing, minimal noise.
- **Calm design:** Apple Reminders-like, whitespace, subtle separators.
- **Accessibility:** usable by default.
- **Privacy restraint:** collect minimal data.

### Non-goals (guardrails)
- Pantry tracking, recipes, meal planning
- Coupons, store catalogs, price comparisons
- Enterprise permission systems / audit logs
- ML-heavy personalization in v1

---

## 2) Research Log

### Research Questions (open)
- RQ-001: What specifically makes Apple Reminders grocery lists feel effortless?
- RQ-002: Why does AnyList have a “wow factor” (UX moments + mechanics)?
- RQ-003: Why is Bring! recommended for collaboration? What does “single-tap add” mean there?

### Planned Research Items
#### R-2026-01-25-001 — Apple Reminders Grocery Lists (`hypothesis`) [P0]
- **Observation goal:** group layout, add flow, check flow, collaboration moments
- **Why it matters:** sets our “iOS-ish calm” bar
- **Action:** capture UX patterns + constraints to mirror/avoid

#### R-2026-01-25-002 — AnyList “wow factor” (`hypothesis`) [P1]
- **Observation goal:** delight moments, suggestions, grouping, speed
- **Why it matters:** informs what we *don’t* build in v1 and what we must nail

#### R-2026-01-25-003 — Bring! collaboration & “single tap add” (`hypothesis`) [P0]
- **Observation goal:** fast add mechanics, sharing flow, notification/awareness
- **Why it matters:** our differentiator is speed + collaboration; Bring! is a strong reference

---

## 3) Feature Ideas (Backlog; some already decided)

> Note: Entries marked `decision` reflect agreed behavior today. Anything marked `idea` or `hypothesis` is not committed.

### Authentication & Account
#### F-2026-01-25-001 — Social login (Apple + Google) (`decision`) [P0]
- **Problem:** reduce onboarding friction; consistent cross-platform auth
- **Proposed UX:** sign in immediately after install or first use
- **Dependencies:** Firebase Auth providers
- **Notes:** show login method in Account screen

#### F-2026-01-25-002 — Account screen basics (`idea`) [P1]
- **Proposed UX:** display name, login method, sign out
- **Open:** account deletion? export? (likely later)

### Lists Overview
#### F-2026-01-25-010 — Lists overview screen (`idea`) [P0]
- **Problem:** user needs quick entry point to lists
- **Proposed UX:** list of shopping lists + “+” create button
- **Edge cases:** membership limits; empty states

#### F-2026-01-25-011 — “Updated X minutes ago” indicator (`hypothesis`) [P2]
- **Open:** define what counts as an update (add/edit/check/reorder?)
- **Risk:** if too chatty, becomes meaningless

### List Detail / Items
#### F-2026-01-25-020 — CRUD items + check off (`idea`) [P0]
- **Must support:** create, update, delete, check/uncheck
- **Constraints:** up to 200 items per list (current assumption)

#### F-2026-01-25-021 — Mass delete checked items (`idea`) [P1]
- **UX:** button/action to remove checked items
- **Edge:** confirm? undo? (v1 likely “confirm only”)

#### F-2026-01-25-022 — In-list search (expandable bar) (`idea`) [P1]
- **UX:** search icon expands into search field; filters items
- **Decision references:** see D-…-010 for v1 search semantics (below)

### “Single Tap Add” / Quick Add
#### F-2026-01-25-030 — Quick Add panel (“single tap add”) (`decision`) [P0]
- **Problem:** adding common items must be near frictionless at the store
- **Decision summary:** see D-…-001, D-…-002, D-…-003, D-…-004
- **Open:** confirm exact UX layout and where it appears (pattern work)

### Grouping & Drag/Drop
#### F-2026-01-25-040 — One-level grouping (`decision`) [P0]
- **Problem:** grocery organization (e.g., dairy, produce)
- **Notes:** checked item behavior is special; see D-…-020

#### F-2026-01-25-041 — Drag & drop reorder + move between groups (`decision`) [P0]
- **Scope:** unchecked items only; not into Completed; see D-…-030

### Collaboration
#### F-2026-01-25-050 — Invite via one-time link (`idea`) [P0]
- **UX:** share link via WhatsApp/Messenger/etc.
- **Acceptance:** link opens to accept flow; sign-in if needed
- **Decisions:** equal permissions, member caps; see D-…-040, D-…-041, D-…-042

#### F-2026-01-25-051 — In-app change highlighting (`decision`) [P1]
- **Goal:** awareness without push spam
- **Decision:** 2s highlight for visible items; same style for add/edit/check; see D-…-050

#### F-2026-01-25-052 — Push notifications (`idea`) [P3]
- **Status:** not committed; explicitly deferred until in-app awareness is proven
- **Risk:** annoyance / spam / complexity

### Web / Website
#### F-2026-01-25-060 — Simple website with sign up (`idea`) [P2]
- **Goal:** light marketing and entry point for invites / onboarding
- **Open:** web signup flow decision (see Q-…-001)

---

## 4) Decisions Log (Normative)

### Quick Add & Duplicates
#### D-2026-01-25-001 — Quick Add static list size & localization (`decision`)
- **Decision:** Quick Add static list shows **up to 10 items**.
- **Decision:** Must support **German (priority)**; **English if possible**.
- **Rationale:** keeps UX calm and fast; avoids a massive catalog and decision fatigue.

#### D-2026-01-25-002 — Quick Add “recent” source (`decision`)
- **Decision:** Quick Add uses **last checked-off items**, not “recently added”.
- **Rationale:** “recently added” often still exists on list; checked-off history is more useful.

#### D-2026-01-25-003 — No duplicates policy (`decision`)
- **Decision:** **No duplicates at all** (case-insensitive, trimmed).
- **Rationale:** households hate clutter; duplicates create confusion in collaboration.

#### D-2026-01-25-004 — Duplicate interaction behavior (`decision`)
- **Decision:** Tapping an existing item:
    - If unchecked → highlight item
    - If checked → uncheck + highlight
- **Rationale:** “single tap add” remains true without duplicates.

### Groups & Checked Items
#### D-2026-01-25-020 — Checked items remain grouped (`decision`)
- **Decision:** Checked items **stay in their group**, marked as checked.
- **Decision:** A group appears in Completed section **only if all items in that group are checked**.
- **Rationale:** preserves mental model and reduces “teleporting” UI.

#### D-2026-01-25-021 — Group name uniqueness (`decision`)
- **Decision:** No duplicate group names (case-insensitive).
- **Rationale:** avoids confusion in drag/drop and search.

> Note: Group count limit (e.g., max 10) is currently an **assumption** awaiting confirmation; see Q-…-004.

### Drag & Drop
#### D-2026-01-25-030 — Drag/drop scope (`decision`)
- **Decision:** Drag/drop applies to **unchecked items only**.
- **Decision:** Items cannot be dragged into Completed section.
- **Rationale:** simplifies ordering semantics; reduces conflict pain.

### Offline & Sync
#### D-2026-01-25-040 — Offline queue limit (`decision`)
- **Decision:** Offline operation queue limited to **200 operations**.
- **Rationale:** bound complexity and memory; aligns with item constraints.

### Change Awareness
#### D-2026-01-25-050 — Change highlight behavior (`decision`)
- **Decision:** Highlight for **2 seconds** for visible changed items.
- **Decision:** Same highlight style for add/edit/check.
- **Rationale:** awareness without spam; minimal cognitive load.

### Collaboration & Membership Model
#### D-2026-01-25-060 — No owner; equal members (`decision`)
- **Decision:** There is **no owner role**; all members have equal permissions.
- **Rationale:** trusted small groups; avoids permission complexity.

#### D-2026-01-25-061 — Any member can invite (`decision`)
- **Decision:** Every member can create invite links.
- **Rationale:** reduces friction in households/roommates.

#### D-2026-01-25-062 — Member cap per list (`decision`)
- **Decision:** Max **3 members per list**.
- **Rationale:** aligns with “small trusted group” intent and keeps UX simple.

#### D-2026-01-25-063 — Invite accepted when list is full (`decision`)
- **Decision:** If list is full, invite open shows **friendly error**.
- **Rationale:** clear and calm failure mode.

### Lists & Onboarding
#### D-2026-01-25-070 — No seeded example list (`decision`)
- **Decision:** Do **not** auto-create a seeded list.
- **Decision:** Onboarding should guide user to **create their first list**.
- **Rationale:** ownership/limits confusion avoided; user intent clearer.

#### D-2026-01-25-071 — Membership limit per user (`decision`)
- **Decision:** User may be a member of **up to 3 total lists**.
- **Rationale:** v1 simplicity and UI constraints (can be revisited later).

#### D-2026-01-25-072 — List deletion in ownerless model (`decision`)
- **Decision:** Any member may delete a list.
- **Decision:** Deletion requires warning/confirmation.
- **Rationale:** equal members; avoid complex admin roles.

### Stack & Repo
#### D-2026-01-25-080 — Stack choice (`decision`)
- **Decision:** Expo + Tamagui + Firebase.
- **Rationale:** fastest path to polished cross-platform, offline-friendly collaboration.

#### D-2026-01-25-081 — Monorepo recommended (`decision`)
- **Decision:** Use monorepo for app/web/shared packages; include backend if lightweight.
- **Rationale:** shared UI + schemas + firebase wiring; agents reuse.

---

## 5) Constraints & Limits (Current State)

> This section is *current assumptions + decided constraints*. Changes should be recorded as constraint changes.

### Current constraints (as of 2026-01-25)
- **Max members per list:** 3 (`decision`)
- **Max list memberships per user:** 3 (`decision`)
- **Max items per list:** 200 (`assumption`, referenced repeatedly)
- **Offline queue ops:** 200 (`decision`)
- **Duplicate items:** none (`decision`)
- **Group depth:** 1 level (`decision`)
- **Drag/drop:** unchecked only (`decision`)

### Constraint change log
#### C-2026-01-25-001 — Seeded list removed (`decision`)
- **From → To:** seeded example list → onboarding-created first list
- **Rationale:** reduces confusion about ownership/limits; respects user intent

---

## 6) Open Questions (Need Answers Before Promotion)

#### Q-2026-01-25-001 — Web signup flow (`open`) [P0]
- **Question:** If a user signs up on web, do we steer them to native app or continue in web app?
- **Options:**
    - A) Web-first: continue in web app; optional app install upsell
    - B) App-first: encourage app install; web is fallback
- **Notes:** impacts landing pages, deep links, onboarding tone

#### Q-2026-01-25-002 — Invite link handling & URL format (`open`) [P0]
- **Question:** Exact URL structure and routing rules (web vs app installed).
- **Notes:** affects domain/DNS setup, universal/app links, and onboarding

#### Q-2026-01-25-003 — Invite expiry duration (`open`) [P1]
- **Question:** Confirm expiry duration (7 days was discussed earlier; not re-affirmed in latest decisions).
- **Options:** 24h / 7d / 30d
- **Note:** should match “safe + lightweight” principle

#### Q-2026-01-25-004 — Group count limit (`open`) [P2]
- **Question:** Do we enforce a max number of groups per list (suggested earlier: 10)?
- **Why:** keeps UI manageable; prevents chaos with 200 items

#### Q-2026-01-25-005 — “Updated X minutes ago” definition (`open`) [P2]
- **Question:** Which actions update list activity time?
- **Options:** content changes only vs include reorder/check vs include view

#### Q-2026-01-25-006 — Item text constraints (`open`) [P2]
- **Question:** Max item length; emoji allowed; normalization rules beyond trim/lowercase?
- **Why:** affects duplicates and UI truncation

---

## 7) UX Patterns & Component Notes (Agent-Friendly)

#### U-2026-01-25-001 — Calm grouped list layout (`idea`)
- **Use when:** showing list items + groups
- **Do:** whitespace, subtle separators, predictable row heights
- **Don’t:** dense controls, heavy icons everywhere
- **Notes:** align with iOS-ish feel

#### U-2026-01-25-002 — Quick Add chips (`hypothesis`)
- **Use when:** adding frequent items quickly
- **Do:** small set (<=10), localized, one-tap behavior
- **Don’t:** huge catalog or nested pickers
- **Notes:** verify against Bring! research

#### U-2026-01-25-003 — Change highlight (`decision`)
- **Pattern:** briefly highlight visible changed rows for 2s
- **Goal:** awareness without push spam

---

## 8) Technical Notes (Non-binding unless promoted)

#### T-2026-01-25-001 — Monorepo layout (`idea`)
- **Candidate structure:**
    - apps/mobile (Expo)
    - apps/web (Expo Web)
    - packages/ui (Tamagui kit)
    - packages/domain (types + schemas)
    - packages/firebase (client init + helpers)
    - backend/firebase (rules + functions)

#### T-2026-01-25-002 — Engineering standards (`idea`)
- TypeScript strict
- AGENTS.md for agent rules
- GitHub Actions: lint/typecheck/tests/build
- Dependabot for npm + GH actions
- Gemini PR review automation
- spec-kit for planning; beads + ralph loop for agent orchestration

---

## 9) Promotion Workflow (Ledger → Spec)
When committing a feature to build:
1. Ensure open questions are answered
2. Add/confirm a `decision` entry if behavior needs to be precise
3. Mark feature entry as `promoted`
4. Add to active spec + (if needed) explicit behavior appendix
5. Generate tasks via spec-kit

---

## 10) Next Actions (Suggested)
- Convert research questions into a short, scheduled research sprint (Bring! + Reminders + AnyList).
- Resolve Q-001 (web flow) and Q-002 (invite link format) early; they influence onboarding and domain setup.
- Confirm max items per list (200) and group count limit to prevent late-stage UX rework.
