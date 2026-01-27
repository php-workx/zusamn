// @vitest-environment node
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';

const PROJECT_ID = 'zusamn-test';

// Read rules from the firebase directory
const rulesPath = resolve(__dirname, '../../../firebase/firestore.rules');
const rules = readFileSync(rulesPath, 'utf8');

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: 'localhost',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

// ============================================
// USER DOCUMENT TESTS
// ============================================
describe('User documents (/users/{userId})', () => {
  it('owner can read their own user document', async () => {
    const userId = 'user1';

    // Seed with admin context
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users', userId), {
        displayName: 'Test User',
        email: 'test@example.com',
        locale: 'en',
        createdAt: Date.now(),
      });
    });

    // Read as owner
    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();
    await assertSucceeds(getDoc(doc(userDb, 'users', userId)));
  });

  it('owner can write to their own user document', async () => {
    const userId = 'user1';
    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();

    await assertSucceeds(
      setDoc(doc(userDb, 'users', userId), {
        displayName: 'Test User',
        email: 'test@example.com',
        locale: 'en',
        createdAt: Date.now(),
      })
    );
  });

  it('other users cannot read someone else user document', async () => {
    const ownerId = 'user1';
    const otherUserId = 'user2';

    // Seed with admin context
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users', ownerId), {
        displayName: 'Owner User',
        email: 'owner@example.com',
        locale: 'en',
        createdAt: Date.now(),
      });
    });

    // Try to read as another user
    const otherContext = testEnv.authenticatedContext(otherUserId);
    const otherDb = otherContext.firestore();
    await assertFails(getDoc(doc(otherDb, 'users', ownerId)));
  });

  it('other users cannot write to someone else user document', async () => {
    const ownerId = 'user1';
    const otherUserId = 'user2';

    const otherContext = testEnv.authenticatedContext(otherUserId);
    const otherDb = otherContext.firestore();

    await assertFails(
      setDoc(doc(otherDb, 'users', ownerId), {
        displayName: 'Hacked User',
        email: 'hacked@example.com',
        locale: 'en',
        createdAt: Date.now(),
      })
    );
  });

  it('unauthenticated users cannot read user documents', async () => {
    const userId = 'user1';

    // Seed with admin context
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users', userId), {
        displayName: 'Test User',
        email: 'test@example.com',
        locale: 'en',
        createdAt: Date.now(),
      });
    });

    const unauthContext = testEnv.unauthenticatedContext();
    const unauthDb = unauthContext.firestore();
    await assertFails(getDoc(doc(unauthDb, 'users', userId)));
  });
});

// ============================================
// LIST DOCUMENT TESTS
// ============================================
describe('List documents (/lists/{listId})', () => {
  it('FR-AUTH-003: user can create a list with themselves as the only member', async () => {
    const userId = 'user1';
    const listId = 'list1';

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();

    await assertSucceeds(
      setDoc(doc(userDb, 'lists', listId), {
        ownerUserId: userId,
        memberIds: [userId],
        createdAt: Date.now(),
      })
    );
  });

  it('user cannot create a list with another user as member', async () => {
    const userId = 'user1';
    const listId = 'list1';

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();

    await assertFails(
      setDoc(doc(userDb, 'lists', listId), {
        ownerUserId: userId,
        memberIds: ['otherUser'],
        createdAt: Date.now(),
      })
    );
  });

  it('user cannot create a list with multiple members', async () => {
    const userId = 'user1';
    const listId = 'list1';

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();

    await assertFails(
      setDoc(doc(userDb, 'lists', listId), {
        ownerUserId: userId,
        memberIds: [userId, 'user2'],
        createdAt: Date.now(),
      })
    );
  });

  it('member can read a list they belong to', async () => {
    const userId = 'user1';
    const listId = 'list1';

    // Seed list
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'lists', listId), {
        ownerUserId: userId,
        memberIds: [userId],
        createdAt: Date.now(),
      });
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();
    await assertSucceeds(getDoc(doc(userDb, 'lists', listId)));
  });

  it('non-member cannot read a list', async () => {
    const ownerId = 'user1';
    const nonMemberId = 'user2';
    const listId = 'list1';

    // Seed list
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'lists', listId), {
        ownerUserId: ownerId,
        memberIds: [ownerId],
        createdAt: Date.now(),
      });
    });

    const nonMemberContext = testEnv.authenticatedContext(nonMemberId);
    const nonMemberDb = nonMemberContext.firestore();
    await assertFails(getDoc(doc(nonMemberDb, 'lists', listId)));
  });

  it('member can update list to add up to 3 members', async () => {
    const userId = 'user1';
    const listId = 'list1';

    // Seed list with 1 member
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'lists', listId), {
        ownerUserId: userId,
        memberIds: [userId],
        createdAt: Date.now(),
      });
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();

    // Add 2nd member
    await assertSucceeds(
      updateDoc(doc(userDb, 'lists', listId), {
        memberIds: [userId, 'user2'],
      })
    );
  });

  it('FR-SHARE-007: member can update list to have exactly 3 members', async () => {
    const userId = 'user1';
    const listId = 'list1';

    // Seed list
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'lists', listId), {
        ownerUserId: userId,
        memberIds: [userId],
        createdAt: Date.now(),
      });
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();

    // Update to 3 members
    await assertSucceeds(
      updateDoc(doc(userDb, 'lists', listId), {
        memberIds: [userId, 'user2', 'user3'],
      })
    );
  });

  it('FR-SHARE-007: member cannot update list to have more than 3 members', async () => {
    const userId = 'user1';
    const listId = 'list1';

    // Seed list
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'lists', listId), {
        ownerUserId: userId,
        memberIds: [userId],
        createdAt: Date.now(),
      });
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();

    // Try to add 4th member
    await assertFails(
      updateDoc(doc(userDb, 'lists', listId), {
        memberIds: [userId, 'user2', 'user3', 'user4'],
      })
    );
  });

  it('list cannot be deleted', async () => {
    const userId = 'user1';
    const listId = 'list1';

    // Seed list
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'lists', listId), {
        ownerUserId: userId,
        memberIds: [userId, 'user2'],
        createdAt: Date.now(),
      });
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();
    await assertFails(deleteDoc(doc(userDb, 'lists', listId)));
  });

  it('member can delete a list if they are the sole member', async () => {
    const userId = 'user1';
    const listId = 'list1';

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'lists', listId), {
        ownerUserId: userId,
        memberIds: [userId],
        createdAt: Date.now(),
      });
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();

    await assertSucceeds(deleteDoc(doc(userDb, 'lists', listId)));
  });
});

// ============================================
// ITEM TESTS (Delete-wins conflict resolution)
// ============================================
describe('List items (/lists/{listId}/items/{itemId})', () => {
  const setupListWithItem = async (
    listId: string,
    itemId: string,
    memberId: string,
    itemData: Record<string, unknown>
  ) => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'lists', listId), {
        ownerUserId: memberId,
        memberIds: [memberId],
        createdAt: Date.now(),
      });
      await setDoc(doc(db, 'lists', listId, 'items', itemId), itemData);
    });
  };

  it('FR-LIST-003, FR-LIST-022: member can create an item with text up to 100 chars', async () => {
    const userId = 'user1';
    const listId = 'list1';
    const itemId = 'item1';

    // Seed list
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'lists', listId), {
        ownerUserId: userId,
        memberIds: [userId],
        createdAt: Date.now(),
      });
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();

    await assertSucceeds(
      setDoc(doc(userDb, 'lists', listId, 'items', itemId), {
        text: 'Buy milk',
        checked: false,
        deleted: false,
        createdByUserId: userId,
        serverCreatedAt: Date.now(),
        serverUpdatedAt: Date.now(),
      })
    );
  });

  it('FR-LIST-022: member cannot create an item with text over 100 chars', async () => {
    const userId = 'user1';
    const listId = 'list1';
    const itemId = 'item1';

    // Seed list
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'lists', listId), {
        ownerUserId: userId,
        memberIds: [userId],
        createdAt: Date.now(),
      });
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();

    await assertFails(
      setDoc(doc(userDb, 'lists', listId, 'items', itemId), {
        text: 'a'.repeat(101),
        checked: false,
        deleted: false,
        createdByUserId: userId,
        serverCreatedAt: Date.now(),
        serverUpdatedAt: Date.now(),
      })
    );
  });

  it('member can read items', async () => {
    const userId = 'user1';
    const listId = 'list1';
    const itemId = 'item1';

    await setupListWithItem(listId, itemId, userId, {
      text: 'Buy milk',
      checked: false,
      deleted: false,
      createdByUserId: userId,
      serverCreatedAt: Date.now(),
      serverUpdatedAt: Date.now(),
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();
    await assertSucceeds(getDoc(doc(userDb, 'lists', listId, 'items', itemId)));
  });

  it('non-member cannot read items', async () => {
    const ownerId = 'user1';
    const nonMemberId = 'user2';
    const listId = 'list1';
    const itemId = 'item1';

    await setupListWithItem(listId, itemId, ownerId, {
      text: 'Buy milk',
      checked: false,
      deleted: false,
      createdByUserId: ownerId,
      serverCreatedAt: Date.now(),
      serverUpdatedAt: Date.now(),
    });

    const nonMemberContext = testEnv.authenticatedContext(nonMemberId);
    const nonMemberDb = nonMemberContext.firestore();
    await assertFails(getDoc(doc(nonMemberDb, 'lists', listId, 'items', itemId)));
  });

  it('FR-LIST-004: member can update non-deleted item', async () => {
    const userId = 'user1';
    const listId = 'list1';
    const itemId = 'item1';

    await setupListWithItem(listId, itemId, userId, {
      text: 'Buy milk',
      checked: false,
      deleted: false,
      createdByUserId: userId,
      serverCreatedAt: Date.now(),
      serverUpdatedAt: Date.now(),
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();

    await assertSucceeds(
      updateDoc(doc(userDb, 'lists', listId, 'items', itemId), {
        checked: true,
        serverUpdatedAt: Date.now(),
      })
    );
  });

  it('FR-LIST-006: member can mark item as deleted (soft delete)', async () => {
    const userId = 'user1';
    const listId = 'list1';
    const itemId = 'item1';

    await setupListWithItem(listId, itemId, userId, {
      text: 'Buy milk',
      checked: false,
      deleted: false,
      createdByUserId: userId,
      serverCreatedAt: Date.now(),
      serverUpdatedAt: Date.now(),
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();

    await assertSucceeds(
      updateDoc(doc(userDb, 'lists', listId, 'items', itemId), {
        deleted: true,
        serverUpdatedAt: Date.now(),
      })
    );
  });

  it('member cannot update deleted item (delete-wins)', async () => {
    const userId = 'user1';
    const listId = 'list1';
    const itemId = 'item1';

    // Create a deleted item
    await setupListWithItem(listId, itemId, userId, {
      text: 'Buy milk',
      checked: false,
      deleted: true,
      createdByUserId: userId,
      serverCreatedAt: Date.now(),
      serverUpdatedAt: Date.now(),
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();

    // Try to update it (keep deleted: true)
    await assertFails(
      updateDoc(doc(userDb, 'lists', listId, 'items', itemId), {
        checked: true,
        deleted: true,
        serverUpdatedAt: Date.now(),
      })
    );
  });

  it('FR-LIST-007: member can undelete a deleted item', async () => {
    const userId = 'user1';
    const listId = 'list1';
    const itemId = 'item1';

    // Create a deleted item
    await setupListWithItem(listId, itemId, userId, {
      text: 'Buy milk',
      checked: false,
      deleted: true,
      createdByUserId: userId,
      serverCreatedAt: Date.now(),
      serverUpdatedAt: Date.now(),
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();

    // Undelete it
    await assertSucceeds(
      updateDoc(doc(userDb, 'lists', listId, 'items', itemId), {
        deleted: false,
        serverUpdatedAt: Date.now(),
      })
    );
  });

  it('item cannot be hard deleted', async () => {
    const userId = 'user1';
    const listId = 'list1';
    const itemId = 'item1';

    await setupListWithItem(listId, itemId, userId, {
      text: 'Buy milk',
      checked: false,
      deleted: false,
      createdByUserId: userId,
      serverCreatedAt: Date.now(),
      serverUpdatedAt: Date.now(),
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();

    await assertFails(deleteDoc(doc(userDb, 'lists', listId, 'items', itemId)));
  });
});

// ============================================
// INVITE TESTS
// ============================================
describe('Invites (/invites/{inviteId})', () => {
  it('authenticated user can read any invite', async () => {
    const userId = 'user1';
    const inviteId = 'invite1';

    // Seed invite
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'invites', inviteId), {
        listId: 'list1',
        inviteAlias: 'Join my list',
        createdByUserId: 'otherUser',
        createdAt: Date.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 86400000)),
        usedBy: null,
      });
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();
    await assertSucceeds(getDoc(doc(userDb, 'invites', inviteId)));
  });

  it('unauthenticated user cannot read invites', async () => {
    const inviteId = 'invite1';

    // Seed invite
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'invites', inviteId), {
        listId: 'list1',
        inviteAlias: 'Join my list',
        createdByUserId: 'user1',
        createdAt: Date.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 86400000)),
        usedBy: null,
      });
    });

    const unauthContext = testEnv.unauthenticatedContext();
    const unauthDb = unauthContext.firestore();
    await assertFails(getDoc(doc(unauthDb, 'invites', inviteId)));
  });

  it('FR-SHARE-003, FR-SHARE-010: member of a list can create an invite', async () => {
    const userId = 'user1';
    const listId = 'list1';
    const inviteId = 'invite1';

    // Seed list with user as member
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'lists', listId), {
        ownerUserId: userId,
        memberIds: [userId],
        createdAt: Date.now(),
      });
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();

    await assertSucceeds(
      setDoc(doc(userDb, 'invites', inviteId), {
        listId,
        inviteAlias: 'Join my list',
        createdByUserId: userId,
        createdAt: Date.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 86400000)),
        usedBy: null,
      })
    );
  });

  it('non-member cannot create an invite for a list', async () => {
    const ownerId = 'user1';
    const nonMemberId = 'user2';
    const listId = 'list1';
    const inviteId = 'invite1';

    // Seed list without nonMember
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'lists', listId), {
        ownerUserId: ownerId,
        memberIds: [ownerId],
        createdAt: Date.now(),
      });
    });

    const nonMemberContext = testEnv.authenticatedContext(nonMemberId);
    const nonMemberDb = nonMemberContext.firestore();

    await assertFails(
      setDoc(doc(nonMemberDb, 'invites', inviteId), {
        listId,
        inviteAlias: 'Join my list',
        createdByUserId: nonMemberId,
        createdAt: Date.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 86400000)),
        usedBy: null,
      })
    );
  });

  it('user cannot create invite with mismatched createdByUserId', async () => {
    const userId = 'user1';
    const listId = 'list1';
    const inviteId = 'invite1';

    // Seed list with user as member
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'lists', listId), {
        ownerUserId: userId,
        memberIds: [userId],
        createdAt: Date.now(),
      });
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();

    await assertFails(
      setDoc(doc(userDb, 'invites', inviteId), {
        listId,
        inviteAlias: 'Join my list',
        createdByUserId: 'someOtherUser', // Wrong user ID
        createdAt: Date.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 86400000)),
        usedBy: null,
      })
    );
  });

  it('user can claim an unused, non-expired invite', async () => {
    const claimerId = 'user2';
    const inviteId = 'invite1';

    // Seed invite (unused, future expiry)
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'invites', inviteId), {
        listId: 'list1',
        inviteAlias: 'Join my list',
        createdByUserId: 'user1',
        createdAt: Date.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 86400000)), // 1 day from now
        usedBy: null,
      });
    });

    const claimerContext = testEnv.authenticatedContext(claimerId);
    const claimerDb = claimerContext.firestore();

    await assertSucceeds(
      updateDoc(doc(claimerDb, 'invites', inviteId), {
        usedBy: claimerId,
        usedAt: Date.now(),
      })
    );
  });

  it('FR-SHARE-006: user cannot claim an already-used invite (one-time use)', async () => {
    const claimerId = 'user3';
    const inviteId = 'invite1';

    // Seed an already-used invite
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'invites', inviteId), {
        listId: 'list1',
        inviteAlias: 'Join my list',
        createdByUserId: 'user1',
        createdAt: Date.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 86400000)),
        usedBy: 'user2', // Already used
        usedAt: Date.now() - 1000,
      });
    });

    const claimerContext = testEnv.authenticatedContext(claimerId);
    const claimerDb = claimerContext.firestore();

    await assertFails(
      updateDoc(doc(claimerDb, 'invites', inviteId), {
        usedBy: claimerId,
        usedAt: Date.now(),
      })
    );
  });

  it('FR-SHARE-005: user cannot claim an expired invite', async () => {
    const claimerId = 'user2';
    const inviteId = 'invite1';

    // Seed an expired invite
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'invites', inviteId), {
        listId: 'list1',
        inviteAlias: 'Join my list',
        createdByUserId: 'user1',
        createdAt: Date.now() - 172800000, // 2 days ago
        expiresAt: Timestamp.fromDate(new Date(Date.now() - 86400000)), // 1 day ago (expired)
        usedBy: null,
      });
    });

    const claimerContext = testEnv.authenticatedContext(claimerId);
    const claimerDb = claimerContext.firestore();

    await assertFails(
      updateDoc(doc(claimerDb, 'invites', inviteId), {
        usedBy: claimerId,
        usedAt: Date.now(),
      })
    );
  });

  it('user cannot claim invite with mismatched usedBy', async () => {
    const claimerId = 'user2';
    const inviteId = 'invite1';

    // Seed invite (unused, future expiry)
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'invites', inviteId), {
        listId: 'list1',
        inviteAlias: 'Join my list',
        createdByUserId: 'user1',
        createdAt: Date.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 86400000)),
        usedBy: null,
      });
    });

    const claimerContext = testEnv.authenticatedContext(claimerId);
    const claimerDb = claimerContext.firestore();

    // Try to claim with a different usedBy value
    await assertFails(
      updateDoc(doc(claimerDb, 'invites', inviteId), {
        usedBy: 'differentUser',
        usedAt: Date.now(),
      })
    );
  });
});

// ============================================
// MEMBERSHIP TESTS
// ============================================
describe('Memberships (/lists/{listId}/memberships/{userId})', () => {
  it('member can read membership documents', async () => {
    const userId = 'user1';
    const listId = 'list1';

    // Seed list and membership
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'lists', listId), {
        ownerUserId: userId,
        memberIds: [userId],
        createdAt: Date.now(),
      });
      await setDoc(doc(db, 'lists', listId, 'memberships', userId), {
        alias: 'My List',
        joinedAt: Date.now(),
      });
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();
    await assertSucceeds(getDoc(doc(userDb, 'lists', listId, 'memberships', userId)));
  });

  it('FR-SWITCH-007: member can update their own alias', async () => {
    const userId = 'user1';
    const listId = 'list1';

    // Seed list and membership
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'lists', listId), {
        ownerUserId: userId,
        memberIds: [userId],
        createdAt: Date.now(),
      });
      await setDoc(doc(db, 'lists', listId, 'memberships', userId), {
        alias: 'My List',
        joinedAt: Date.now(),
      });
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();

    await assertSucceeds(
      updateDoc(doc(userDb, 'lists', listId, 'memberships', userId), {
        alias: 'Renamed List',
      })
    );
  });

  it('FR-SWITCH-009: member cannot update their alias to over 50 chars', async () => {
    const userId = 'user1';
    const listId = 'list1';

    // Seed list and membership
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'lists', listId), {
        ownerUserId: userId,
        memberIds: [userId],
        createdAt: Date.now(),
      });
      await setDoc(doc(db, 'lists', listId, 'memberships', userId), {
        alias: 'My List',
        joinedAt: Date.now(),
      });
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();

    await assertFails(
      updateDoc(doc(userDb, 'lists', listId, 'memberships', userId), {
        alias: 'a'.repeat(51),
      })
    );
  });

  it('FR-LIST-028: member can delete their own membership (leave list)', async () => {
    const userId = 'user1';
    const listId = 'list1';

    // Seed list and membership
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'lists', listId), {
        ownerUserId: userId,
        memberIds: [userId],
        createdAt: Date.now(),
      });
      await setDoc(doc(db, 'lists', listId, 'memberships', userId), {
        alias: 'My List',
        joinedAt: Date.now(),
      });
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();

    await assertSucceeds(deleteDoc(doc(userDb, 'lists', listId, 'memberships', userId)));
  });

  it('member can remove themselves and delete membership in one batch', async () => {
    const userId = 'user1';
    const listId = 'list1';

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'lists', listId), {
        ownerUserId: userId,
        memberIds: [userId],
        createdAt: Date.now(),
      });
      await setDoc(doc(db, 'lists', listId, 'memberships', userId), {
        alias: 'My List',
        joinedAt: Date.now(),
      });
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();
    const batch = writeBatch(userDb);

    batch.delete(doc(userDb, 'lists', listId));
    batch.delete(doc(userDb, 'lists', listId, 'memberships', userId));

    await assertSucceeds(batch.commit());
  });

  it('member cannot delete another user membership', async () => {
    const userId = 'user1';
    const otherId = 'user2';
    const listId = 'list1';

    // Seed list and memberships
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'lists', listId), {
        ownerUserId: userId,
        memberIds: [userId, otherId],
        createdAt: Date.now(),
      });
      await setDoc(doc(db, 'lists', listId, 'memberships', userId), {
        alias: 'My List',
        joinedAt: Date.now(),
      });
      await setDoc(doc(db, 'lists', listId, 'memberships', otherId), {
        alias: 'Other List',
        joinedAt: Date.now(),
      });
    });

    const userContext = testEnv.authenticatedContext(userId);
    const userDb = userContext.firestore();

    await assertFails(deleteDoc(doc(userDb, 'lists', listId, 'memberships', otherId)));
  });

  it('non-member cannot read membership documents', async () => {
    const ownerId = 'user1';
    const nonMemberId = 'user2';
    const listId = 'list1';

    // Seed list and membership
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'lists', listId), {
        ownerUserId: ownerId,
        memberIds: [ownerId],
        createdAt: Date.now(),
      });
      await setDoc(doc(db, 'lists', listId, 'memberships', ownerId), {
        alias: 'My List',
        joinedAt: Date.now(),
      });
    });

    const nonMemberContext = testEnv.authenticatedContext(nonMemberId);
    const nonMemberDb = nonMemberContext.firestore();
    await assertFails(getDoc(doc(nonMemberDb, 'lists', listId, 'memberships', ownerId)));
  });
});
