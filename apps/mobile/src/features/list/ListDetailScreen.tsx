import { useCallback, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  ConfirmDialog,
  EmptyState,
  OverflowMenu,
  Screen,
  Text,
  TopBar,
  YStack,
} from '@zusamn/ui';
import {
  useItems,
  useList,
  useMembership,
  useSyncStatus,
  bulkSoftDelete,
  bulkUndelete,
} from '@zusamn/firebase';
import { useAuthContext, useToast } from '../../providers';
import { useNetworkStatus } from '../../hooks';
import { ItemList } from './ItemList';
import { AddItemInput } from './AddItemInput';

export interface ListDetailScreenProps {
  listId: string;
}

/**
 * List Detail screen showing items with add/check/delete functionality.
 * Shows offline/sync status in TopBar subtitle.
 */
export function ListDetailScreen({ listId }: ListDetailScreenProps) {
  const { user } = useAuthContext();
  const { showUndoToast } = useToast();
  const { isConnected } = useNetworkStatus();
  const { hasPendingWrites, markWritePending } = useSyncStatus();

  // Firebase data
  const { list, isLoading: isListLoading } = useList(listId);
  const { membership } = useMembership(listId, user?.uid);
  const { items, isLoading: isItemsLoading } = useItems(listId);

  // Clear checked dialog
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Determine status subtitle (Offline > Syncing priority per spec)
  const getStatusSubtitle = useCallback((): string | undefined => {
    if (!isConnected) return 'Offline';
    if (hasPendingWrites) return 'Syncing...';
    return undefined;
  }, [isConnected, hasPendingWrites]);

  // Handle clear checked
  const handleClearChecked = useCallback(async () => {
    const checkedItems = items.filter((item) => item.checked);
    if (checkedItems.length === 0) return;

    const itemIds = checkedItems.map((item) => item.id);
    setShowClearDialog(false);

    markWritePending();
    try {
      await bulkSoftDelete(listId, itemIds);

      showUndoToast({
        message: `${checkedItems.length} item${checkedItems.length > 1 ? 's' : ''} cleared`,
        onUndo: async () => {
          markWritePending();
          await bulkUndelete(listId, itemIds);
        },
      });
    } catch {
      // Silent error handling
    }
  }, [listId, items, markWritePending, showUndoToast]);

  const checkedCount = items.filter((item) => item.checked).length;

  // Overflow menu items
  const overflowMenuItems = [
    {
      label: `Clear checked${checkedCount > 0 ? ` (${checkedCount})` : ''}`,
      onPress: () => setShowClearDialog(true),
      destructive: true,
    },
  ];

  // Loading state
  if (isListLoading) {
    return (
      <Screen safeArea={false}>
        <TopBar title="Loading..." />
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Text color="$textMuted">Loading your list...</Text>
        </YStack>
      </Screen>
    );
  }

  // Get list title from membership alias or fallback
  const listTitle = membership?.alias ?? 'Shopping';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Screen safeArea={false}>
        <TopBar
          title={listTitle}
          subtitle={getStatusSubtitle()}
          rightActions={<OverflowMenu items={overflowMenuItems} />}
        />

        {items.length === 0 && !isItemsLoading ? (
          <YStack flex={1} justifyContent="center" paddingBottom={100}>
            <EmptyState
              message="Your list is empty"
              description="Add your first item below"
            />
          </YStack>
        ) : (
          <ItemList
            listId={listId}
            items={items}
            onWritePending={markWritePending}
          />
        )}

        {user?.uid && (
          <AddItemInput
            listId={listId}
            userId={user.uid}
            onWritePending={markWritePending}
          />
        )}

        <ConfirmDialog
          visible={showClearDialog}
          onCancel={() => setShowClearDialog(false)}
          title="Clear checked items?"
          description={`This will delete ${checkedCount} checked item${checkedCount !== 1 ? 's' : ''}.`}
          confirmLabel="Clear"
          onConfirm={handleClearChecked}
          destructive
        />
      </Screen>
    </GestureHandlerRootView>
  );
}
