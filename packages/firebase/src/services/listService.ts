import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  writeBatch,
  limit,
  Timestamp,
  arrayRemove,
} from 'firebase/firestore';
import { initFirebase } from '../client';
import { generateUUID } from '../utils';
import type { List, Membership, Locale } from '@zusamn/domain';

/**
 * Returns the default alias for a list based on locale.
 */
function getDefaultAlias(locale: Locale): string {
  return locale === 'de' ? 'Einkaufen' : 'Shopping';
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
  const listsQuery = query(collection(db, 'lists'), where('memberIds', 'array-contains', userId));
  const listsSnapshot = await getDocs(listsQuery);

  // Fetch all memberships in parallel for better performance
  const membershipPromises = listsSnapshot.docs.map((listDoc) => {
    const membershipRef = doc(db, 'lists', listDoc.id, 'memberships', userId);
    return getDoc(membershipRef);
  });
  const membershipSnapshots = await Promise.all(membershipPromises);

  const results: Array<{ list: List; membership: Membership }> = [];

  // Combine list data with membership data
  for (let i = 0; i < listsSnapshot.docs.length; i++) {
    const listDoc = listsSnapshot.docs[i];
    const membershipSnapshot = membershipSnapshots[i];

    if (!listDoc || !membershipSnapshot) continue;

    const listData = listDoc.data();
    const list: List = {
      id: listDoc.id,
      ownerUserId: listData.ownerUserId,
      memberIds: listData.memberIds,
      createdAt: listData.createdAt,
      itemCount: typeof listData.itemCount === 'number' ? listData.itemCount : undefined,
    };

    if (membershipSnapshot.exists()) {
      const membershipData = membershipSnapshot.data();
      const membership: Membership = {
        userId: membershipData.userId,
        listId: membershipData.listId,
        alias: membershipData.alias,
        joinedAt: membershipData.joinedAt,
      };

      results.push({ list, membership });
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `Missing membership for user ${userId} on list ${listDoc.id}; skipping list entry.`
      );
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

  // Query for list where user is the owner (limit 1 since each user has at most one personal list)
  const listsQuery = query(collection(db, 'lists'), where('ownerUserId', '==', userId), limit(1));
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
    itemCount: typeof listData.itemCount === 'number' ? listData.itemCount : undefined,
  };

  // Get the user's membership
  const membershipRef = doc(db, 'lists', listDoc.id, 'memberships', userId);
  const membershipSnapshot = await getDoc(membershipRef);

  if (!membershipSnapshot.exists()) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Missing membership for owner ${userId} on personal list ${listDoc.id}.`);
    }
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

  const listsQuery = query(collection(db, 'lists'), where('ownerUserId', '==', userId), limit(1));
  const listsSnapshot = await getDocs(listsQuery);

  return !listsSnapshot.empty;
}

/**
 * Leaves a shared list by removing the user's membership.
 * Cannot be used on personal lists (where ownerUserId === userId).
 *
 * @param listId - The list ID to leave
 * @param userId - The user ID leaving the list
 * @throws Error if trying to leave personal list
 */
export async function leaveList(listId: string, userId: string): Promise<void> {
  const db = getDb();

  // First check if this is a personal list
  const listRef = doc(db, 'lists', listId);
  const listSnapshot = await getDoc(listRef);

  if (!listSnapshot.exists()) {
    throw new Error('List not found');
  }

  const listData = listSnapshot.data();
  if (listData.ownerUserId === userId) {
    throw new Error('Cannot leave your personal list');
  }

  // Remove membership and update memberIds array atomically
  const batch = writeBatch(db);

  // Delete membership document
  const membershipRef = doc(db, 'lists', listId, 'memberships', userId);
  batch.delete(membershipRef);

  // Remove from memberIds array
  batch.update(listRef, {
    memberIds: arrayRemove(userId),
  });

  await batch.commit();
}
