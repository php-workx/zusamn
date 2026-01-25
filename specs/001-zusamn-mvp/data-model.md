# Data Model: Zusamn MVP1

**Store**: Google Cloud Firestore
**Pattern**: Collection-based, Normalized Memberships

## Collections

### 1. `users`
**Path**: `/users/{userId}`
- **Read**: Owner only
- **Write**: Owner only

| Field | Type | Description |
|---|---|---|
| `displayName` | `string` | User's public name. |
| `email` | `string` | From Auth provider (read-only). |
| `avatarUrl` | `string?` | From Auth provider. |
| `locale` | `string` | "de" or "en". |
| `createdAt` | `timestamp` | Server timestamp. |
| `deletedAt` | `timestamp?` | If present, account is scheduled for deletion. |

### 2. `lists`
**Path**: `/lists/{listId}`
- **Read**: Members
- **Write**: Members (update) / Owner (create)

| Field | Type | Description |
|---|---|---|
| `ownerUserId` | `string` | Creator ID. |
| `memberIds` | `string[]` | Array of User IDs (Max 3). Used for Security Rules. |
| `createdAt` | `timestamp` | Server timestamp. |

### 3. `memberships`
**Path**: `/lists/{listId}/memberships/{userId}`
- **Read**: List Members
- **Write**: User (Self)

| Field | Type | Description |
|---|---|---|
| `alias` | `string` | User-specific name for the list (e.g., "Einkaufen"). Max 50 chars. |
| `joinedAt` | `timestamp` | Server timestamp. |

### 4. `items`
**Path**: `/lists/{listId}/items/{itemId}`
- **Read**: List Members
- **Write**: List Members

| Field | Type | Description |
|---|---|---|
| `text` | `string` | Item name. Max 100 chars. |
| `checked` | `boolean` | Completion status. |
| `deleted` | `boolean` | Soft-delete flag (Tombstone). |
| `createdByUserId` | `string` | ID of creator. |
| `serverCreatedAt` | `timestamp` | Server timestamp (immutable). |
| `serverUpdatedAt` | `timestamp` | Server timestamp (updated on every write). Used for LWW. |

### 5. `invites`
**Path**: `/invites/{inviteId}`
- **Read**: Authenticated Users (to validate)
- **Write**: Creator (create) / User (claim)

| Field | Type | Description |
|---|---|---|
| `listId` | `string` | Target list. |
| `inviteAlias` | `string` | Name of list as shared by creator. |
| `createdByUserId` | `string` | Creator ID. |
| `createdAt` | `timestamp` | Creation time. |
| `expiresAt` | `timestamp` | Expiry time (Created + 7 days). |
| `usedBy` | `string?` | ID of user who claimed it. |
| `usedAt` | `timestamp?` | Time of claim. |

## Invariants & Validation

1.  **Member Cap**: `list.memberIds` must not exceed 3 entries.
2.  **Item Cap**: 200 items per list (Client enforced).
3.  **Delete Wins**: Updates to `item` where `deleted: true` are rejected (unless `deleted` is being set to `false`).
4.  **One-Time Invite**: `invite` cannot be claimed if `usedBy` is not null.

## ID Generation

- **Items**: Client-generated UUIDv4. Never reuse IDs. If a tombstone exists with that ID, the item stays deleted (prevents zombie resurrection).
- **Lists**: Client-generated UUIDv4 (on personal list creation).
- **Invites**: Client-generated UUIDv4.

## Indexes

**Collection**: `items`
**Fields**: `deleted` ASC, `checked` ASC, `serverCreatedAt` DESC
**Purpose**: List query (Active items, unchecked first, newest first).
