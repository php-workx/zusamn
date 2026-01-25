# Zusamn – Idea Ledger Index (Skimmable)
**Last updated:** 2026-01-25  
**How to use:** This is the entry point. It lists ideas and current status only.  
For rationale/edge-cases/decisions, see `docs/ledger-details.md`.

Legend: `idea` | `hypothesis` | `decision` | `promoted` | `deferred` | `rejected`

---

## A) Onboarding & Account
- [ ] Social login (Apple, Google) — `decision`
- [ ] Onboarding creates first list (no seeded list) — `decision`
- [ ] Account screen: display name, login method, sign out — `idea`

Open questions:
- Web signup flow: app-first vs web-first — `open`

---

## B) Lists Overview
- [ ] Show lists user is a member of — `idea`
- [ ] Create new list via “+” — `idea`
- [ ] “Updated X minutes ago” indicator — `hypothesis` (needs definition)

Constraints:
- User can be member of up to **3** lists — `decision`

---

## C) List Detail – Items
- [ ] Create / edit / delete items — `idea`
- [ ] Check / uncheck items — `idea`
- [ ] Mass delete checked items — `idea`
- [ ] In-list search (icon → expanding bar) — `idea`

Constraints:
- Up to **200** items per list — `assumption` (confirm)

---

## D) Quick Add (“Single Tap Add”)
- [ ] Quick Add panel exists — `decision`
- [ ] Static quick add list (≤ 10 items) — `decision`
- [ ] Language: German prio, English if possible — `decision`
- [ ] Quick add uses “last checked items” — `decision`
- [ ] No duplicates allowed — `decision`
- [ ] Tap existing unchecked → highlight — `decision`
- [ ] Tap existing checked → uncheck + highlight — `decision`

---

## E) Groups & Ordering
- [ ] One-level groups — `decision`
- [ ] Group names unique — `decision`
- [ ] Checked items stay in group and are marked checked — `decision`
- [ ] Group shows in Completed only if all items checked — `decision`
- [ ] Drag & drop for unchecked items only — `decision`
- [ ] Move between groups supported — `decision`
- [ ] Cannot drag into Completed — `decision`

Open questions:
- Max groups per list — `open`

---

## F) Collaboration & Sharing
- [ ] Invite via one-time link (WhatsApp/Messenger/etc) — `idea`
- [ ] Accept invite requires sign-in — `idea`
- [ ] No owner role; all members equal — `decision`
- [ ] Everyone can invite — `decision`
- [ ] Max **3 members** per list — `decision`
- [ ] If list full: friendly error — `decision`
- [ ] In-app change highlight (2s, visible only, same style) — `decision`

Open questions:
- Invite URL format + deep link routing — `open`
- Invite expiry duration — `open`

---

## G) Offline & Sync
- [ ] Offline-first core actions — `decision`
- [ ] Offline ops queue max 200 — `decision`
- [ ] “Instant sync” expectations — `idea` (define later)

---

## H) Web & Website
- [ ] Simple marketing/signup website — `idea`
- [ ] Web app support — `idea`

Open questions:
- Web signup flow: “continue on web vs download app” — `open`

---

## I) Notifications
- [ ] In-app highlight for changed items — `decision`
- [ ] Push notifications — `deferred` (not committed)

---

## J) Tech / Repo / Automation
- [ ] Expo + Tamagui + Firebase — `decision`
- [ ] Monorepo (Turborepo + pnpm) — `decision`
- [ ] TypeScript strict best practices — `idea`
- [ ] AGENTS.md — `idea`
- [ ] GitHub Actions (lint/typecheck/tests/build) — `idea`
- [ ] Dependabot — `idea`
- [ ] Gemini PR review automation — `idea`
- [ ] spec-kit for planning — `decision`
- [ ] beads + ralph loop + orchestrator + 3 parallel agents — `idea`

---

## Top Open Questions (Shortlist)
1) Web signup flow (app-first vs web-first)
2) Invite URL format + routing (web vs app installed)
3) Invite expiry duration
4) Max groups per list
5) Define “Updated X minutes ago”
6) Confirm max items per list (200)
