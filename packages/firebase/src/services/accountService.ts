import { deleteUser } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
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
