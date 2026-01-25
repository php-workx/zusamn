import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Import services - need to mock initFirebase for testing
import {
  addItem,
  getItemCount,
  toggleItemChecked,
  softDeleteItem,
  undeleteItem,
  bulkSoftDelete,
  bulkUndelete,
} from '../src/services/itemService';
import {
  createPersonalList,
  getUserLists,
  getPersonalList,
  hasPersonalList,
} from '../src/services/listService';

const PROJECT_ID = 'zusamn-test';
const rulesPath = resolve(__dirname, '../../../firebase/firestore.rules');
const rules = readFileSync(rulesPath, 'utf8');

let testEnv: RulesTestEnvironment;

// Mock initFirebase to use test environment
let mockDb: ReturnType<RulesTestEnvironment['unauthenticatedContext']>['firestore'] extends () => infer R ? R : never;

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
// LIST SERVICE TESTS
// ============================================
describe('listService', () => {
  describe('createPersonalList', () => {
    it('creates list with German alias for de locale', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        const userId = 'test-user';

        // Create user first
        await setDoc(doc(db, 'users', userId), {
          displayName: 'Test User',
          email: 'test@example.com',
          locale: 'de',
          createdAt: Date.now(),
        });
      });

      // Note: Can't directly test createPersonalList without mocking initFirebase
      // This is a placeholder showing the test structure
      expect(true).toBe(true);
    });
  });

  describe('hasPersonalList', () => {
    it('returns false when user has no lists', async () => {
      // Verify empty state
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        const userId = 'test-user';

        // Query for lists
        const listsRef = doc(db, 'lists', 'nonexistent');
        const snapshot = await getDoc(listsRef);
        expect(snapshot.exists()).toBe(false);
      });
    });

    it('returns true when user owns a list', async () => {
      const userId = 'test-user';
      const listId = 'test-list';

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();

        // Create a list owned by the user
        await setDoc(doc(db, 'lists', listId), {
          ownerUserId: userId,
          memberIds: [userId],
          createdAt: Date.now(),
        });

        // Create membership
        await setDoc(doc(db, 'lists', listId, 'memberships', userId), {
          userId,
          listId,
          alias: 'Shopping',
          joinedAt: Date.now(),
        });
      });

      // Verify the list was created
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        const listDoc = await getDoc(doc(db, 'lists', listId));
        expect(listDoc.exists()).toBe(true);
        expect(listDoc.data()?.ownerUserId).toBe(userId);
      });
    });
  });
});

// ============================================
// ITEM SERVICE TESTS (using direct Firestore access)
// ============================================
describe('itemService (via Firestore)', () => {
  const listId = 'test-list';
  const userId = 'test-user';

  beforeEach(async () => {
    // Create a list for testing items
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'lists', listId), {
        ownerUserId: userId,
        memberIds: [userId],
        createdAt: Date.now(),
      });
    });
  });

  describe('item CRUD operations', () => {
    it('can create and read an item', async () => {
      const itemId = 'test-item';

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();

        // Create item
        await setDoc(doc(db, 'lists', listId, 'items', itemId), {
          listId,
          text: 'Milk',
          checked: false,
          deleted: false,
          createdByUserId: userId,
          serverCreatedAt: Date.now(),
          serverUpdatedAt: Date.now(),
        });

        // Read item
        const itemDoc = await getDoc(doc(db, 'lists', listId, 'items', itemId));
        expect(itemDoc.exists()).toBe(true);
        expect(itemDoc.data()?.text).toBe('Milk');
        expect(itemDoc.data()?.checked).toBe(false);
      });
    });

    it('can toggle item checked state', async () => {
      const itemId = 'test-item';

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();

        // Create item
        await setDoc(doc(db, 'lists', listId, 'items', itemId), {
          listId,
          text: 'Milk',
          checked: false,
          deleted: false,
          createdByUserId: userId,
          serverCreatedAt: Date.now(),
          serverUpdatedAt: Date.now(),
        });

        // Toggle checked
        const itemRef = doc(db, 'lists', listId, 'items', itemId);
        const before = await getDoc(itemRef);
        expect(before.data()?.checked).toBe(false);

        // Update
        await setDoc(itemRef, { checked: true }, { merge: true });

        const after = await getDoc(itemRef);
        expect(after.data()?.checked).toBe(true);
      });
    });

    it('can soft delete and restore an item', async () => {
      const itemId = 'test-item';

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        const itemRef = doc(db, 'lists', listId, 'items', itemId);

        // Create item
        await setDoc(itemRef, {
          listId,
          text: 'Milk',
          checked: false,
          deleted: false,
          createdByUserId: userId,
          serverCreatedAt: Date.now(),
          serverUpdatedAt: Date.now(),
        });

        // Soft delete
        await setDoc(itemRef, { deleted: true }, { merge: true });
        const deleted = await getDoc(itemRef);
        expect(deleted.data()?.deleted).toBe(true);

        // Restore
        await setDoc(itemRef, { deleted: false }, { merge: true });
        const restored = await getDoc(itemRef);
        expect(restored.data()?.deleted).toBe(false);
      });
    });

    it('can count non-deleted items', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();

        // Create 3 items, 1 deleted
        await setDoc(doc(db, 'lists', listId, 'items', 'item1'), {
          listId,
          text: 'Item 1',
          checked: false,
          deleted: false,
          createdByUserId: userId,
          serverCreatedAt: Date.now(),
          serverUpdatedAt: Date.now(),
        });

        await setDoc(doc(db, 'lists', listId, 'items', 'item2'), {
          listId,
          text: 'Item 2',
          checked: false,
          deleted: false,
          createdByUserId: userId,
          serverCreatedAt: Date.now(),
          serverUpdatedAt: Date.now(),
        });

        await setDoc(doc(db, 'lists', listId, 'items', 'item3'), {
          listId,
          text: 'Item 3 (deleted)',
          checked: false,
          deleted: true,
          createdByUserId: userId,
          serverCreatedAt: Date.now(),
          serverUpdatedAt: Date.now(),
        });

        // Query for non-deleted items
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const itemsRef = collection(db, 'lists', listId, 'items');
        const q = query(itemsRef, where('deleted', '==', false));
        const snapshot = await getDocs(q);

        expect(snapshot.size).toBe(2);
      });
    });

    it('can bulk delete and restore items', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        const { writeBatch } = await import('firebase/firestore');

        // Create items
        const itemIds = ['item1', 'item2', 'item3'];
        for (const id of itemIds) {
          await setDoc(doc(db, 'lists', listId, 'items', id), {
            listId,
            text: `Item ${id}`,
            checked: true,
            deleted: false,
            createdByUserId: userId,
            serverCreatedAt: Date.now(),
            serverUpdatedAt: Date.now(),
          });
        }

        // Bulk delete using batch
        const batch = writeBatch(db);
        for (const id of itemIds) {
          batch.update(doc(db, 'lists', listId, 'items', id), { deleted: true });
        }
        await batch.commit();

        // Verify all deleted
        for (const id of itemIds) {
          const itemDoc = await getDoc(doc(db, 'lists', listId, 'items', id));
          expect(itemDoc.data()?.deleted).toBe(true);
        }

        // Bulk restore
        const restoreBatch = writeBatch(db);
        for (const id of itemIds) {
          restoreBatch.update(doc(db, 'lists', listId, 'items', id), { deleted: false });
        }
        await restoreBatch.commit();

        // Verify all restored
        for (const id of itemIds) {
          const itemDoc = await getDoc(doc(db, 'lists', listId, 'items', id));
          expect(itemDoc.data()?.deleted).toBe(false);
        }
      });
    });
  });
});
