import { deleteUser } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import {
  arrayRemove,
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { initFirebase } from '../client';
import { signOut } from '../auth';
import { getUser } from './userService';

// Re-export for backwards compatibility
export { getUser as getUserById } from './userService';

function isReauthRequiredError(error: unknown): boolean {
  return (
    error instanceof FirebaseError &&
    error.code === 'auth/requires-recent-login'
  );
}

/**
 * Deletes a user account and cleans up all associated data.
 * - Removes user's memberships from all lists
 * - Updates shared lists to remove user from memberIds
 * - Soft-deletes personal lists (deleted=true, memberIds=[])
 * - Deletes user document
 *
 * @param db - Firestore database instance
 * @param userId - The ID of the user to delete
 */
export async function deleteAccountWithDb(
  db: Firestore,
  userId: string
): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required');
  }

  // Find all lists where user is a member
  const listsQuery = query(
    collection(db, 'lists'),
    where('memberIds', 'array-contains', userId)
  );
  const listsSnapshot = await getDocs(listsQuery);

  const batch = writeBatch(db);

  // Process each list
  for (const listDoc of listsSnapshot.docs) {
    const listData = listDoc.data();
    const listRef = doc(db, 'lists', listDoc.id);
    const membershipRef = doc(db, 'lists', listDoc.id, 'memberships', userId);

    // Delete user's membership
    batch.delete(membershipRef);

    if (listData.ownerUserId === userId) {
      // Personal list: soft-delete and clear members
      batch.update(listRef, {
        deleted: true,
        memberIds: [],
      });
    } else {
      // Shared list: remove user from memberIds
      batch.update(listRef, {
        memberIds: arrayRemove(userId),
      });
    }
  }

  // Delete user document
  const userRef = doc(db, 'users', userId);
  batch.delete(userRef);

  await batch.commit();
}

export async function deleteAccount(userId: string): Promise<void> {
  const { auth, db } = initFirebase();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user');
  }

  // Validate that the requested userId matches the authenticated user
  // to prevent accidental or malicious mismatched deletions
  if (currentUser.uid !== userId) {
    throw new Error(
      `User ID mismatch: authenticated as ${currentUser.uid} but requested to delete ${userId}`
    );
  }

  // Delete user data from Firestore first
  await deleteAccountWithDb(db, currentUser.uid);

  try {
    await deleteUser(currentUser);
  } catch (error) {
    if (isReauthRequiredError(error)) {
      throw error;
    }

    await signOut();
    throw error instanceof Error ? error : new Error('Failed to delete account');
  }

  await signOut();
}
