import { doc, getDoc, type DocumentSnapshot } from 'firebase/firestore';
import { initFirebase } from '../client';
import type { User } from '@zusamn/domain';

/**
 * Gets the Firestore database instance.
 */
function getDb() {
  return initFirebase().db;
}

/**
 * Maps a Firestore document snapshot to a User object.
 * Extracts fields with sensible defaults.
 */
function mapSnapshotToUser(snapshot: DocumentSnapshot): User {
  const data = snapshot.data() ?? {};
  return {
    id: snapshot.id,
    displayName: data.displayName ?? '',
    email: data.email ?? '',
    avatarUrl: data.avatarUrl ?? null,
    locale: data.locale ?? 'en',
    createdAt: data.createdAt?.toMillis?.() ?? data.createdAt ?? Date.now(),
    deletedAt: data.deletedAt?.toMillis?.() ?? data.deletedAt ?? null,
  };
}

/**
 * Fetches a single user by their ID.
 *
 * @param userId - The ID of the user to fetch
 * @returns The user if found, null otherwise
 */
export async function getUser(userId: string): Promise<User | null> {
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    return null;
  }

  return mapSnapshotToUser(userSnapshot);
}

/**
 * Fetches multiple users by their IDs.
 * Returns users in the same order as input IDs.
 * Skips any users that are not found.
 *
 * @param userIds - Array of user IDs to fetch
 * @returns Array of users (may be shorter than input if some not found)
 */
export async function getUsers(userIds: string[]): Promise<User[]> {
  if (userIds.length === 0) {
    return [];
  }

  const db = getDb();
  const users: User[] = [];

  // Fetch users in parallel
  const userPromises = userIds.map(async (userId) => {
    const userRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      return null;
    }

    return mapSnapshotToUser(userSnapshot);
  });

  const results = await Promise.all(userPromises);

  // Filter out nulls (users not found)
  for (const user of results) {
    if (user) {
      users.push(user);
    }
  }

  return users;
}

/**
 * Fetches display names for multiple users by their IDs.
 * Returns names in the same order as input IDs.
 * Uses 'Unknown' for any users that are not found.
 *
 * @param userIds - Array of user IDs to fetch
 * @returns Array of display names
 */
export async function getUserDisplayNames(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) {
    return [];
  }

  const db = getDb();

  // Fetch users in parallel
  const namePromises = userIds.map(async (userId) => {
    const userRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      return 'Unknown';
    }

    const data = userSnapshot.data();
    return data.displayName?.trim() || 'Unknown';
  });

  return Promise.all(namePromises);
}
