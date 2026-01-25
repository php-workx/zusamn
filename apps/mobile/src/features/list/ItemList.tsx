import { useCallback } from 'react';
import { FlatList, type ListRenderItemInfo } from 'react-native';
import type { Item } from '@zusamn/domain';
import { toggleItemChecked, softDeleteItem, undeleteItem } from '@zusamn/firebase';
import { useToast } from '../../providers';
import { SwipeableListRow } from './SwipeableListRow';
import { useItemOrdering } from './useItemOrdering';

export interface ItemListProps {
  listId: string;
  items: Item[];
  onWritePending: () => void;
}

/**
 * List of items with swipe-to-delete and check/uncheck.
 * Items are ordered: unchecked first (newest first), then checked.
 */
export function ItemList({ listId, items, onWritePending }: ItemListProps) {
  const { showUndoToast } = useToast();
  const orderedItems = useItemOrdering(items);

  const handleToggleChecked = useCallback(
    async (item: Item) => {
      onWritePending();
      try {
        await toggleItemChecked(listId, item.id);
      } catch {
        // Silent error handling - UI will reflect actual state
      }
    },
    [listId, onWritePending]
  );

  const handleDelete = useCallback(
    async (item: Item) => {
      onWritePending();
      try {
        await softDeleteItem(listId, item.id);

        showUndoToast({
          message: 'Item deleted',
          onUndo: async () => {
            onWritePending();
            await undeleteItem(listId, item.id);
          },
        });
      } catch {
        // Silent error handling
      }
    },
    [listId, onWritePending, showUndoToast]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Item>) => {
      return (
        <SwipeableListRow
          item={item}
          onToggleChecked={handleToggleChecked}
          onDelete={handleDelete}
        />
      );
    },
    [handleToggleChecked, handleDelete]
  );

  const keyExtractor = useCallback((item: Item) => item.id, []);

  return (
    <FlatList
      data={orderedItems}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={{ paddingBottom: 100 }}
      keyboardShouldPersistTaps="handled"
    />
  );
}
