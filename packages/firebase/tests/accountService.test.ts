// @vitest-environment node
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, it, expect } from 'vitest';
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';
import { deleteAccountWithDb } from '../src/services/accountService';

const PROJECT_ID = 'zusamn-test-account';
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

describe('deleteAccountWithDb', () => {
  it('removes memberships, updates lists, deletes personal list, and deletes user', async () => {
    const userId = 'user-1';
    const otherUserId = 'user-2';
    const personalListId = 'list-personal';
    const sharedListId = 'list-shared';

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();

      await setDoc(doc(adminDb, 'users', userId), {
        displayName: 'User One',
        email: 'user1@example.com',
        locale: 'en',
        createdAt: Date.now(),
      });

      await setDoc(doc(adminDb, 'lists', personalListId), {
        ownerUserId: userId,
        memberIds: [userId],
        createdAt: Date.now(),
      });

      await setDoc(doc(adminDb, 'lists', sharedListId), {
        ownerUserId: otherUserId,
        memberIds: [userId, otherUserId],
        createdAt: Date.now(),
      });

      await setDoc(
        doc(adminDb, 'lists', personalListId, 'memberships', userId),
        {
          alias: 'Personal',
          userId,
          listId: personalListId,
          joinedAt: Timestamp.now(),
        }
      );

      await setDoc(
        doc(adminDb, 'lists', sharedListId, 'memberships', userId),
        {
          alias: 'Shared',
          userId,
          listId: sharedListId,
          joinedAt: Timestamp.now(),
        }
      );

      await setDoc(
        doc(adminDb, 'lists', sharedListId, 'memberships', otherUserId),
        {
          alias: 'Shared',
          userId: otherUserId,
          listId: sharedListId,
          joinedAt: Timestamp.now(),
        }
      );
    });

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await deleteAccountWithDb(
        context.firestore() as unknown as Firestore,
        userId
      );
    });

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();

      const userDoc = await getDoc(doc(adminDb, 'users', userId));
      expect(userDoc.exists()).toBe(false);

      const personalMembership = await getDoc(
        doc(adminDb, 'lists', personalListId, 'memberships', userId)
      );
      expect(personalMembership.exists()).toBe(false);

      const sharedMembership = await getDoc(
        doc(adminDb, 'lists', sharedListId, 'memberships', userId)
      );
      expect(sharedMembership.exists()).toBe(false);

      const otherMembership = await getDoc(
        doc(adminDb, 'lists', sharedListId, 'memberships', otherUserId)
      );
      expect(otherMembership.exists()).toBe(true);

      const personalList = await getDoc(doc(adminDb, 'lists', personalListId));
      expect(personalList.exists()).toBe(false);

      const sharedList = await getDoc(doc(adminDb, 'lists', sharedListId));
      expect(sharedList.exists()).toBe(true);
      expect(sharedList.data()?.memberIds).toEqual([otherUserId]);

      const membershipQuery = await getDocs(
        collectionGroup(adminDb, 'memberships')
      );
      const membershipIds = membershipQuery.docs.map((docSnap) => docSnap.id);
      expect(membershipIds).toEqual([otherUserId]);

      const listDocs = await getDocs(collection(adminDb, 'lists'));
      const listIds = listDocs.docs.map((docSnap) => docSnap.id).sort();
      expect(listIds).toEqual([sharedListId]);
    });
  });
});
