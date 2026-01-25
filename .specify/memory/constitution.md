# Zusamn Constitution

This document defines the enduring principles that guide all product and engineering decisions. It describes **what we value** and **how we make tradeoffs**, not specific features, limits, or technologies.

Specific constraints (limits, tech choices, release scope) belong in feature specifications.

---

## Core Principles

### 1. Speed Over Features

The app must feel instant and responsive, even when work is happening in the background. When choosing between a faster experience and a richer feature, choose speed. Users open a shopping list in a hurry—at the store, while cooking, in passing. Every tap, every loading state, every modal is friction.

**Tradeoff guidance**: If a feature adds complexity to the core flow (view → add → check), it needs exceptional justification. A simpler, faster experience beats a powerful, slower one.

### 2. Offline-First

The app must work without a network connection. Shopping happens in basements, rural stores, and airplane mode. Users should not be blocked from viewing or editing their list due to connectivity.

**Tradeoff guidance**: Design data models and sync strategies assuming offline is the default state, not an edge case. Degrade gracefully; never block core actions on connectivity.

### 3. Collaboration Without Annoyance

Sharing should feel safe and lightweight. Users share lists with family and roommates—people they trust but don't want to spam. No accidental oversharing, no notification fatigue, no confusing permission models.

Collaboration assumes a small, trusted group; features designed for large or anonymous groups are out of scope.

**Tradeoff guidance**: Prefer implicit trust (all members equal) over complex permission hierarchies. Prefer in-app awareness over push notifications. Make sharing easy to start and easy to leave.

### 4. Simplicity Over Power

This is a shopping list, not a life management system. Every feature we add is a feature users must learn, maintain, and navigate around. The best feature is often the one we don't build.

**Tradeoff guidance**: When in doubt, cut it. If a feature doesn't directly improve the core loop, reject it. Resist scope creep from adjacent domains (recipes, pantry, meal planning, coupons).

### 5. Calm, Clear Design

The visual language should feel calm and familiar—closer to Apple Reminders than to a power-user productivity app. Whitespace, subtle separators, rounded corners, predictable patterns.

**Tradeoff guidance**: Consistency beats novelty. Use established patterns. New UI components must earn their place by solving a problem existing components cannot.

### 6. Accessible By Default

The app must be usable by people with different abilities. This isn't a checkbox—it's a design constraint that shapes decisions from the start.

**Tradeoff guidance**: Touch targets must be comfortable. Text must be readable. Screen readers must work. Keyboard users (web) must not be blocked. These are requirements, not nice-to-haves.

### 7. Privacy As Restraint

Collect only what the app needs to function. Users share personal data (what they eat, who they live with) implicitly through their lists. Respect that trust by minimizing what we store and never selling or sharing it.

No dark patterns, growth hacks, or behavioral manipulation.

**Tradeoff guidance**: When designing a feature, ask "do we need this data?" before "how do we store this data?" Prefer client-side logic over server-side tracking.

### 8. Focus Protects Quality

Saying no to features protects the quality of the features we ship. A small, polished app beats a large, buggy one. Scope discipline is a feature.

**Tradeoff guidance**: Every release should do fewer things better, not more things adequately. Defer good ideas to future releases rather than shipping them half-baked.

### 9. Boring Over Clever

Prefer simple, understandable solutions over clever abstractions. Code and design should be obvious to the next person who reads it—including future you, and including AI agents.

**Tradeoff guidance**: If a solution requires significant explanation to justify itself, it is likely the wrong solution. Choose the approach that needs the least documentation.

---

## Governance

This constitution changes rarely. It defines values, not implementations.

**When to amend**:
- A core value is discovered to be wrong or missing
- Two principles conflict in ways not resolvable by tradeoff guidance
- The product's fundamental purpose changes

**When NOT to amend**:
- Adding or changing feature limits
- Choosing or changing technologies
- Scoping a specific release
- Adding validation or testing requirements

Amendments require written rationale explaining why the existing principles are insufficient.

---

**Version**: 2.1.0 | **Ratified**: 2026-01-24
