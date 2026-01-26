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
import { FirebaseError } from 'firebase/app';
import { deleteUser } from 'firebase/auth';
import { initFirebase } from '../client';
import { signOut } from '../auth';

const isReauthRequiredError = (error: unknown): boolean =>
  error instanceof FirebaseError && error.code === 'auth/requires-recent-login';

export async function deleteAccountWithDb(
  db: Firestore,
  userId: string
): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const listQuery = query(
    collection(db, 'lists'),
    where('memberIds', 'array-contains', userId)
  );
  const listSnapshot = await getDocs(listQuery);
  const batch = writeBatch(db);

  for (const docSnap of listSnapshot.docs) {
    const data = docSnap.data() as { ownerUserId?: string; memberIds?: string[] };
    const memberIds = Array.isArray(data.memberIds) ? data.memberIds : [];
    const isPersonal =
      data.ownerUserId === userId &&
      memberIds.length === 1 &&
      memberIds[0] === userId;

    if (isPersonal) {
      batch.delete(docSnap.ref);
      batch.delete(doc(db, 'lists', docSnap.id, 'memberships', userId));
      continue;
    }

    batch.update(docSnap.ref, { memberIds: arrayRemove(userId) });
    batch.delete(doc(db, 'lists', docSnap.id, 'memberships', userId));
  }

  batch.delete(doc(db, 'users', userId));

  await batch.commit();
}

export async function deleteAccount(userId: string): Promise<void> {
  const { db, auth } = initFirebase();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user.');
  }

  await deleteAccountWithDb(db, userId);
  try {
    await deleteUser(currentUser);
  } catch (error) {
    if (isReauthRequiredError(error)) {
      throw error;
    }
    await signOut();
    throw error;
  }
  await signOut();
}
