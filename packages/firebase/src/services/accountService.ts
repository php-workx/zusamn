import { deleteUser } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { User } from '@zusamn/domain';
import { initFirebase } from '../client';
import { signOut } from '../auth';

function isReauthRequiredError(error: unknown): boolean {
  return (
    error instanceof FirebaseError &&
    error.code === 'auth/requires-recent-login'
  );
}

export async function deleteAccountWithDb(userId: string): Promise<void> {
  const { db } = initFirebase();
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { deletedAt: serverTimestamp() });
}

export async function deleteAccount(userId: string): Promise<void> {
  const { auth } = initFirebase();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user');
  }

  try {
    await deleteUser(currentUser);
  } catch (error) {
    if (isReauthRequiredError(error)) {
      throw error;
    }

    await signOut();
    throw error instanceof Error ? error : new Error('Failed to delete account');
  }

  try {
    await deleteAccountWithDb(userId);
  } finally {
    await signOut();
  }
}

/**
 * Fetches a user document by ID.
 * Returns null if the user does not exist.
 *
 * @param userId - The ID of the user to fetch
 * @returns The user if found, null otherwise
 */
export async function getUserById(userId: string): Promise<User | null> {
  const { db } = initFirebase();
  const userRef = doc(db, 'users', userId);
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    return null;
  }

  const data = userSnapshot.data();
  return {
    id: userSnapshot.id,
    displayName: data.displayName ?? '',
    email: data.email ?? '',
    avatarUrl: data.avatarUrl ?? null,
    locale: data.locale ?? 'en',
    createdAt: data.createdAt?.toMillis?.() ?? data.createdAt ?? Date.now(),
    deletedAt: data.deletedAt?.toMillis?.() ?? data.deletedAt ?? null,
  };
}
