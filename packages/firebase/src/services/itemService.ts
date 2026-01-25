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

/** Error code for list capacity exceeded */
export const LIST_FULL_ERROR = 'LIST_FULL';

/**
 * Adds a new item to a shopping list using a transaction for atomic limit enforcement.
 *
 * @param listId - The ID of the list to add the item to
 * @param text - The item text (max 100 characters)
 * @param userId - The ID of the user creating the item
 * @returns The created item (with placeholder timestamps until server resolves them)
 * @throws Error with message starting with LIST_FULL_ERROR if limit reached
 * @throws Error if validation fails
 */
export async function addItem(
  listId: string,
  text: string,
  userId: string
): Promise<Item> {
  // Validate text before starting transaction
  const validation = validateItemText(text);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const db = getDb();
  const listRef = doc(db, 'lists', listId);
  const itemId = doc(getItemsCollectionRef(listId)).id;
  const itemRef = getItemRef(listId, itemId);
  const trimmedText = text.trim();

  // Use transaction for atomic count check and item creation
  await runTransaction(db, async (transaction) => {
    const listSnapshot = await transaction.get(listRef);
    if (!listSnapshot.exists()) {
      throw new Error(`List not found: ${listId}`);
    }

    const listData = listSnapshot.data();
    const currentCount = listData.itemCount ?? 0;

    if (currentCount >= LIMITS.ITEMS_PER_LIST_MAX) {
      throw new Error(
        `${LIST_FULL_ERROR}: List has reached the maximum of ${LIMITS.ITEMS_PER_LIST_MAX} items`
      );
    }

    // Create the item
    const itemData = {
      listId,
      text: trimmedText,
      checked: false,
      deleted: false,
      createdByUserId: userId,
      serverCreatedAt: serverTimestamp(),
      serverUpdatedAt: serverTimestamp(),
    };

    transaction.set(itemRef, itemData);

    // Increment the item count on the list
    transaction.update(listRef, {
      itemCount: currentCount + 1,
    });
  });

  // Return the item object with placeholder timestamps
  const now = Date.now();
  const item: Item = {
    id: itemId,
    listId,
    text: trimmedText,
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
 * Uses a transaction to atomically update the list's itemCount.
 *
 * @param listId - The ID of the list containing the item
 * @param itemId - The ID of the item to soft delete
 */
export async function softDeleteItem(
  listId: string,
  itemId: string
): Promise<void> {
  const db = getDb();
  const listRef = doc(db, 'lists', listId);
  const itemRef = getItemRef(listId, itemId);

  await runTransaction(db, async (transaction) => {
    const listSnapshot = await transaction.get(listRef);
    if (!listSnapshot.exists()) {
      throw new Error(`List not found: ${listId}`);
    }

    const listData = listSnapshot.data();
    const currentCount = listData.itemCount ?? 0;

    transaction.update(itemRef, {
      deleted: true,
      serverUpdatedAt: serverTimestamp(),
    });

    // Decrement the item count (min 0)
    transaction.update(listRef, {
      itemCount: Math.max(0, currentCount - 1),
    });
  });
}

/**
 * Restores a soft-deleted item by setting deleted: false.
 * Uses a transaction to atomically update the list's itemCount.
 *
 * @param listId - The ID of the list containing the item
 * @param itemId - The ID of the item to restore
 */
export async function undeleteItem(
  listId: string,
  itemId: string
): Promise<void> {
  const db = getDb();
  const listRef = doc(db, 'lists', listId);
  const itemRef = getItemRef(listId, itemId);

  await runTransaction(db, async (transaction) => {
    const listSnapshot = await transaction.get(listRef);
    if (!listSnapshot.exists()) {
      throw new Error(`List not found: ${listId}`);
    }

    const listData = listSnapshot.data();
    const currentCount = listData.itemCount ?? 0;

    transaction.update(itemRef, {
      deleted: false,
      serverUpdatedAt: serverTimestamp(),
    });

    // Increment the item count
    transaction.update(listRef, {
      itemCount: currentCount + 1,
    });
  });
}

/**
 * Soft deletes multiple items atomically using a transaction.
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
  const listRef = doc(db, 'lists', listId);

  await runTransaction(db, async (transaction) => {
    const listSnapshot = await transaction.get(listRef);
    if (!listSnapshot.exists()) {
      throw new Error(`List not found: ${listId}`);
    }

    const listData = listSnapshot.data();
    const currentCount = listData.itemCount ?? 0;

    for (const itemId of itemIds) {
      const itemRef = getItemRef(listId, itemId);
      transaction.update(itemRef, {
        deleted: true,
        serverUpdatedAt: serverTimestamp(),
      });
    }

    // Decrement the item count by the number of deleted items
    transaction.update(listRef, {
      itemCount: Math.max(0, currentCount - itemIds.length),
    });
  });
}

/**
 * Restores multiple soft-deleted items atomically using a transaction.
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
  const listRef = doc(db, 'lists', listId);

  await runTransaction(db, async (transaction) => {
    const listSnapshot = await transaction.get(listRef);
    if (!listSnapshot.exists()) {
      throw new Error(`List not found: ${listId}`);
    }

    const listData = listSnapshot.data();
    const currentCount = listData.itemCount ?? 0;

    for (const itemId of itemIds) {
      const itemRef = getItemRef(listId, itemId);
      transaction.update(itemRef, {
        deleted: false,
        serverUpdatedAt: serverTimestamp(),
      });
    }

    // Increment the item count by the number of restored items
    transaction.update(listRef, {
      itemCount: currentCount + itemIds.length,
    });
  });
}
