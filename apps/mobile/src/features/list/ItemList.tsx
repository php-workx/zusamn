import { useCallback } from 'react';
import { Alert, FlatList, type ListRenderItemInfo } from 'react-native';
import type { Item } from '@zusamn/domain';
import { toggleItemChecked, softDeleteItem, undeleteItem } from '@zusamn/firebase';
import { YStack } from '@zusamn/ui';
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
  const showError = useCallback((message: string, error?: unknown) => {
    console.error(message, error);
    Alert.alert('Something went wrong', message);
  }, []);

  const handleToggleChecked = useCallback(
    async (item: Item) => {
      onWritePending();
      try {
        await toggleItemChecked(listId, item.id);
      } catch (error) {
        showError('Unable to update item. Please try again.', error);
      }
    },
    [listId, onWritePending, showError]
  );

  const handleDelete = useCallback(
    async (item: Item) => {
      onWritePending();
      try {
        await softDeleteItem(listId, item.id);

        showUndoToast({
          message: 'Item deleted',
          onUndo: async () => {
            try {
              onWritePending();
              await undeleteItem(listId, item.id);
            } catch (error) {
              showError('Unable to undo delete. Please try again.', error);
            }
          },
        });
      } catch {
        showError('Unable to delete item. Please try again.');
      }
    },
    [listId, onWritePending, showUndoToast, showError]
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
    <YStack flex={1}>
      <FlatList
        data={orderedItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
      />
    </YStack>
  );
}

const contentContainerStyle = { paddingBottom: 100 };
