import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { initFirebase } from '../client';
import type { List, Membership, Locale } from '@zusamn/domain';

/**
 * Returns the default alias for a list based on locale.
 */
function getDefaultAlias(locale: Locale): string {
  return locale === 'de' ? 'Einkaufen' : 'Shopping';
}

/**
 * Generates a UUIDv4.
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gets the Firestore database instance.
 */
function getDb() {
  return initFirebase().db;
}

/**
 * Creates a personal list for a user with a locale-aware default alias.
 * Uses a batch write for atomic operation.
 */
export async function createPersonalList(
  userId: string,
  locale: Locale
): Promise<{ list: List; membership: Membership }> {
  const db = getDb();
  const listId = generateUUID();
  const now = Timestamp.now().toMillis();
  const alias = getDefaultAlias(locale);

  const list: List = {
    id: listId,
    ownerUserId: userId,
    memberIds: [userId],
    createdAt: now,
    itemCount: 0,
  };

  const membership: Membership = {
    userId,
    listId,
    alias,
    joinedAt: now,
  };

  const batch = writeBatch(db);

  // Create list document
  const listRef = doc(db, 'lists', listId);
  batch.set(listRef, {
    ownerUserId: list.ownerUserId,
    memberIds: list.memberIds,
    createdAt: list.createdAt,
    itemCount: list.itemCount,
  });

  // Create membership subcollection document
  const membershipRef = doc(db, 'lists', listId, 'memberships', userId);
  batch.set(membershipRef, {
    userId: membership.userId,
    listId: membership.listId,
    alias: membership.alias,
    joinedAt: membership.joinedAt,
  });

  await batch.commit();

  return { list, membership };
}

/**
 * Gets all lists that a user is a member of, along with their membership data.
 * Returns personal list first, then alphabetically by alias.
 */
export async function getUserLists(
  userId: string
): Promise<Array<{ list: List; membership: Membership }>> {
  const db = getDb();

  // Query all lists where user is a member
  const listsQuery = query(
    collection(db, 'lists'),
    where('memberIds', 'array-contains', userId)
  );
  const listsSnapshot = await getDocs(listsQuery);

  const results: Array<{ list: List; membership: Membership }> = [];

  // For each list, get the user's membership
  for (const listDoc of listsSnapshot.docs) {
    const listData = listDoc.data();
    const list: List = {
      id: listDoc.id,
      ownerUserId: listData.ownerUserId,
      memberIds: listData.memberIds,
      createdAt: listData.createdAt,
      itemCount:
        typeof listData.itemCount === 'number' ? listData.itemCount : undefined,
    };

    // Get user's membership document
    const membershipRef = doc(db, 'lists', listDoc.id, 'memberships', userId);
    const membershipSnapshot = await getDoc(membershipRef);

    if (membershipSnapshot.exists()) {
      const membershipData = membershipSnapshot.data();
      const membership: Membership = {
        userId: membershipData.userId,
        listId: membershipData.listId,
        alias: membershipData.alias,
        joinedAt: membershipData.joinedAt,
      };

      results.push({ list, membership });
    }
  }

  // Sort: personal list first (ownerUserId === userId), then alphabetically by alias
  results.sort((a, b) => {
    const aIsPersonal = a.list.ownerUserId === userId;
    const bIsPersonal = b.list.ownerUserId === userId;

    if (aIsPersonal && !bIsPersonal) return -1;
    if (!aIsPersonal && bIsPersonal) return 1;

    return a.membership.alias.localeCompare(b.membership.alias);
  });

  return results;
}

/**
 * Gets the user's personal list (the one they own).
 * Returns null if user doesn't have a personal list.
 */
export async function getPersonalList(
  userId: string
): Promise<{ list: List; membership: Membership } | null> {
  const db = getDb();

  // Query for list where user is the owner
  const listsQuery = query(
    collection(db, 'lists'),
    where('ownerUserId', '==', userId)
  );
  const listsSnapshot = await getDocs(listsQuery);

  if (listsSnapshot.empty) {
    return null;
  }

  // Get the first matching list (should only be one personal list)
  const listDoc = listsSnapshot.docs[0];
  if (!listDoc) {
    return null;
  }
  const listData = listDoc.data();
  const list: List = {
    id: listDoc.id,
    ownerUserId: listData.ownerUserId,
    memberIds: listData.memberIds,
    createdAt: listData.createdAt,
    itemCount:
      typeof listData.itemCount === 'number' ? listData.itemCount : undefined,
  };

  // Get the user's membership
  const membershipRef = doc(db, 'lists', listDoc.id, 'memberships', userId);
  const membershipSnapshot = await getDoc(membershipRef);

  if (!membershipSnapshot.exists()) {
    return null;
  }

  const membershipData = membershipSnapshot.data();
  const membership: Membership = {
    userId: membershipData.userId,
    listId: membershipData.listId,
    alias: membershipData.alias,
    joinedAt: membershipData.joinedAt,
  };

  return { list, membership };
}

/**
 * Quick check if user has a personal list.
 * Used during first login to decide if we need to create one.
 */
export async function hasPersonalList(userId: string): Promise<boolean> {
  const db = getDb();

  const listsQuery = query(
    collection(db, 'lists'),
    where('ownerUserId', '==', userId)
  );
  const listsSnapshot = await getDocs(listsQuery);

  return !listsSnapshot.empty;
}
