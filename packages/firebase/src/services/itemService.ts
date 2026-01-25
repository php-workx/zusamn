import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  writeBatch,
  runTransaction,
} from 'firebase/firestore';
import { initFirebase } from '../client';
import type { Item } from '@zusamn/domain';
import { validateItemText, LIMITS } from '@zusamn/domain';

/**
 * Gets the Firestore database instance.
 */
function getDb() {
  return initFirebase().db;
}

/**
 * Gets a reference to an item document.
 */
function getItemRef(listId: string, itemId: string) {
  const db = getDb();
  return doc(db, 'lists', listId, 'items', itemId);
}

/**
 * Gets a reference to the items collection for a list.
 */
function getItemsCollectionRef(listId: string) {
  const db = getDb();
  return collection(db, 'lists', listId, 'items');
}

/**
 * Counts non-deleted items in a list.
 * Used for enforcing the 200 items per list limit.
 */
export async function getItemCount(listId: string): Promise<number> {
  const itemsRef = getItemsCollectionRef(listId);
  const itemsQuery = query(itemsRef, where('deleted', '==', false));
  const snapshot = await getDocs(itemsQuery);
  return snapshot.size;
}

/**
 * Adds a new item to a shopping list.
 *
 * @param listId - The ID of the list to add the item to
 * @param text - The item text (max 100 characters)
 * @param userId - The ID of the user creating the item
 * @returns The created item (with placeholder timestamps until server resolves them)
 * @throws Error if validation fails or item limit (200) is reached
 */
export async function addItem(
  listId: string,
  text: string,
  userId: string
): Promise<Item> {
  // Validate text
  const validation = validateItemText(text);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Check item count limit
  const currentCount = await getItemCount(listId);
  if (currentCount >= LIMITS.ITEMS_PER_LIST_MAX) {
    throw new Error(
      `Cannot add item: list has reached the maximum of ${LIMITS.ITEMS_PER_LIST_MAX} items`
    );
  }

  // Generate item ID using Firestore's auto-ID (crypto.randomUUID not available in RN)
  const itemId = doc(getItemsCollectionRef(listId)).id;

  // Prepare the item data with server timestamps
  const itemData = {
    listId,
    text: text.trim(),
    checked: false,
    deleted: false,
    createdByUserId: userId,
    serverCreatedAt: serverTimestamp(),
    serverUpdatedAt: serverTimestamp(),
  };

  // Create the item document
  const itemRef = getItemRef(listId, itemId);
  await setDoc(itemRef, itemData);

  // Return the item object
  // Note: serverTimestamp() resolves on the server, so we use Date.now() as placeholder
  // The actual timestamps will be available when reading the document back
  const now = Date.now();
  const item: Item = {
    id: itemId,
    listId,
    text: text.trim(),
    checked: false,
    deleted: false,
    createdByUserId: userId,
    serverCreatedAt: now,
    serverUpdatedAt: now,
  };

  return item;
}

/**
 * Toggles the checked state of an item.
 * Uses a transaction to prevent race conditions from concurrent toggles.
 *
 * @param listId - The ID of the list containing the item
 * @param itemId - The ID of the item to toggle
 * @throws Error if item does not exist
 */
export async function toggleItemChecked(
  listId: string,
  itemId: string
): Promise<void> {
  const db = getDb();
  const itemRef = getItemRef(listId, itemId);

  // Use transaction to atomically read and write
  await runTransaction(db, async (transaction) => {
    const itemSnapshot = await transaction.get(itemRef);
    if (!itemSnapshot.exists()) {
      throw new Error(`Item not found: ${itemId}`);
    }

    const currentData = itemSnapshot.data();
    const newCheckedState = !currentData.checked;

    transaction.update(itemRef, {
      checked: newCheckedState,
      serverUpdatedAt: serverTimestamp(),
    });
  });
}

/**
 * Soft deletes an item by setting deleted: true.
 * This is a tombstone approach that supports undo functionality.
 *
 * @param listId - The ID of the list containing the item
 * @param itemId - The ID of the item to soft delete
 */
export async function softDeleteItem(
  listId: string,
  itemId: string
): Promise<void> {
  const itemRef = getItemRef(listId, itemId);

  await updateDoc(itemRef, {
    deleted: true,
    serverUpdatedAt: serverTimestamp(),
  });
}

/**
 * Restores a soft-deleted item by setting deleted: false.
 * Used when user taps "Undo" on the delete toast.
 *
 * @param listId - The ID of the list containing the item
 * @param itemId - The ID of the item to restore
 */
export async function undeleteItem(
  listId: string,
  itemId: string
): Promise<void> {
  const itemRef = getItemRef(listId, itemId);

  await updateDoc(itemRef, {
    deleted: false,
    serverUpdatedAt: serverTimestamp(),
  });
}

/**
 * Soft deletes multiple items atomically using a batch write.
 * Used for the "Clear checked" feature.
 *
 * @param listId - The ID of the list containing the items
 * @param itemIds - Array of item IDs to soft delete
 */
export async function bulkSoftDelete(
  listId: string,
  itemIds: string[]
): Promise<void> {
  if (itemIds.length === 0) {
    return;
  }

  const db = getDb();
  const batch = writeBatch(db);

  for (const itemId of itemIds) {
    const itemRef = getItemRef(listId, itemId);
    batch.update(itemRef, {
      deleted: true,
      serverUpdatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

/**
 * Restores multiple soft-deleted items atomically using a batch write.
 * Used for undo of "Clear checked" feature.
 *
 * @param listId - The ID of the list containing the items
 * @param itemIds - Array of item IDs to restore
 */
export async function bulkUndelete(
  listId: string,
  itemIds: string[]
): Promise<void> {
  if (itemIds.length === 0) {
    return;
  }

  const db = getDb();
  const batch = writeBatch(db);

  for (const itemId of itemIds) {
    const itemRef = getItemRef(listId, itemId);
    batch.update(itemRef, {
      deleted: false,
      serverUpdatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}
