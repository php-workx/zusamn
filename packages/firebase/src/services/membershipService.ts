import { doc, updateDoc } from 'firebase/firestore';
import { initFirebase } from '../client';
import { MAX_ALIAS_LENGTH } from '@zusamn/domain';

/**
 * Gets the Firestore database instance.
 */
function getDb() {
  return initFirebase().db;
}

/**
 * Updates the alias for a user's membership on a list.
 * This is a per-user operation - other members' aliases are unaffected.
 *
 * @param listId - The list ID
 * @param userId - The user ID
 * @param newAlias - The new alias (max 50 characters)
 */
export async function updateAlias(listId: string, userId: string, newAlias: string): Promise<void> {
  const trimmedAlias = newAlias.trim();

  if (!trimmedAlias) {
    throw new Error('Alias cannot be empty');
  }

  if (trimmedAlias.length > MAX_ALIAS_LENGTH) {
    throw new Error(`Alias cannot exceed ${MAX_ALIAS_LENGTH} characters`);
  }

  const db = getDb();
  const membershipRef = doc(db, 'lists', listId, 'memberships', userId);

  await updateDoc(membershipRef, {
    alias: trimmedAlias,
  });
}
