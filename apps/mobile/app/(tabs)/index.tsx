import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, type TextInput, type ListRenderItemInfo } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import {
  EmptyState,
  ListRow,
  OverflowMenu,
  Screen,
  Text,
  TopBar,
  XStack,
  YStack,
  ConfirmDialog,
} from '@zusamn/ui';
import {
  useItems,
  useList,
  useMembership,
  useSyncStatus,
  addItem,
  toggleItemChecked,
  softDeleteItem,
  undeleteItem,
  bulkSoftDelete,
  bulkUndelete,
  getItemCount,
  getPersonalList,
  createPersonalList,
  useUser,
} from '@zusamn/firebase';
import { MAX_TEXT_LENGTH, MAX_ITEMS_PER_LIST } from '@zusamn/domain';
import type { Item } from '@zusamn/domain';
import { useAuthContext, useToast } from '../../src/providers';
import { useNetworkStatus, useLastUsedList } from '../../src/hooks';
import { FixedBottomInput } from '../../src/components';

/**
 * List Detail screen - main screen for viewing and managing a shopping list.
 * Shows items, allows add/check/delete operations with offline support.
 */
export default function ListDetailScreen() {
  const { user } = useAuthContext();
  const { showUndoToast } = useToast();
  const { isConnected } = useNetworkStatus();
  const { hasPendingWrites, markWritePending } = useSyncStatus();
  const { getLastUsedListId, setLastUsedListId } = useLastUsedList();

  // List state
  const [listId, setListId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<Error | null>(null);

  // Input state
  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<TextInput>(null) as React.RefObject<TextInput>;

  // Clear checked dialog
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Swipeable refs for closing
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  // Firebase hooks
  const { user: firestoreUser } = useUser(user?.uid, {
    displayName: user?.displayName ?? undefined,
    email: user?.email ?? undefined,
  });
  const { list, isLoading: isListLoading } = useList(listId);
  const { membership } = useMembership(listId, user?.uid);
  const { items, isLoading: isItemsLoading } = useItems(listId);

  // Initialize personal list on mount
  useEffect(() => {
    async function initializeList() {
      if (!user?.uid || !firestoreUser) return;

      try {
        // Check for last used list first
        const lastListId = getLastUsedListId();
        if (lastListId) {
          setListId(lastListId);
          setIsInitializing(false);
          return;
        }

        // Check for existing personal list
        const existingList = await getPersonalList(user.uid);
        if (existingList) {
          setListId(existingList.list.id);
          setLastUsedListId(existingList.list.id);
          setIsInitializing(false);
          return;
        }

        // Create personal list for first-time users
        const { list: newList } = await createPersonalList(
          user.uid,
          firestoreUser.locale
        );
        setListId(newList.id);
        setLastUsedListId(newList.id);
        setIsInitializing(false);
      } catch (error) {
        setInitError(
          error instanceof Error ? error : new Error('Failed to initialize list')
        );
        setIsInitializing(false);
      }
    }

    initializeList();
  }, [user?.uid, firestoreUser, getLastUsedListId, setLastUsedListId]);

  // Determine status subtitle
  const getStatusSubtitle = useCallback((): string | undefined => {
    // Priority: Offline > Sync pending
    if (!isConnected) return 'Offline';
    if (hasPendingWrites) return 'Syncing...';
    return undefined;
  }, [isConnected, hasPendingWrites]);

  // Handle add item
  const handleAddItem = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || !listId || !user?.uid) return;

    // Check item limit
    const count = await getItemCount(listId);
    if (count >= MAX_ITEMS_PER_LIST) {
      // Could show a toast here, for now just return
      return;
    }

    setInputValue('');
    markWritePending();

    try {
      await addItem(listId, text, user.uid);
    } catch (error) {
      // Restore input on error
      setInputValue(text);
    }
  }, [inputValue, listId, user?.uid, markWritePending]);

  // Handle check/uncheck
  const handleToggleChecked = useCallback(
    async (item: Item) => {
      if (!listId) return;
      markWritePending();
      try {
        await toggleItemChecked(listId, item.id);
      } catch {
        // Silent error handling - UI will reflect actual state
      }
    },
    [listId, markWritePending]
  );

  // Handle delete with undo
  const handleDeleteItem = useCallback(
    async (item: Item) => {
      if (!listId) return;

      // Close any open swipeable
      swipeableRefs.current.get(item.id)?.close();

      markWritePending();
      try {
        await softDeleteItem(listId, item.id);

        showUndoToast({
          message: 'Item deleted',
          onUndo: async () => {
            markWritePending();
            await undeleteItem(listId, item.id);
          },
        });
      } catch {
        // Silent error handling
      }
    },
    [listId, markWritePending, showUndoToast]
  );

  // Handle clear checked
  const handleClearChecked = useCallback(async () => {
    if (!listId) return;

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

  // Separate items into unchecked and checked
  const uncheckedItems = items.filter((item) => !item.checked);
  const checkedItems = items.filter((item) => item.checked);

  // Combine for display: unchecked first, then checked
  const displayItems = [...uncheckedItems, ...checkedItems];
  const checkedCount = checkedItems.length;

  // Overflow menu items
  const overflowMenuItems = [
    {
      label: `Clear checked${checkedCount > 0 ? ` (${checkedCount})` : ''}`,
      onPress: () => setShowClearDialog(true),
      destructive: true,
    },
  ];

  // Render delete action for swipe
  const renderRightActions = useCallback(() => {
    return (
      <XStack
        backgroundColor="$danger"
        justifyContent="center"
        alignItems="center"
        paddingHorizontal="$4"
      >
        <Text color="white" fontWeight="$2">
          Delete
        </Text>
      </XStack>
    );
  }, []);

  // Render item
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Item>) => {
      return (
        <Swipeable
          ref={(ref) => {
            if (ref) {
              swipeableRefs.current.set(item.id, ref);
            } else {
              swipeableRefs.current.delete(item.id);
            }
          }}
          renderRightActions={renderRightActions}
          onSwipeableOpen={() => handleDeleteItem(item)}
          friction={2}
          rightThreshold={40}
        >
          <ListRow
            text={item.text}
            checked={item.checked}
            onPress={() => handleToggleChecked(item)}
          />
        </Swipeable>
      );
    },
    [handleToggleChecked, handleDeleteItem, renderRightActions]
  );

  // Key extractor
  const keyExtractor = useCallback((item: Item) => item.id, []);

  // Loading state
  if (isInitializing || isListLoading) {
    return (
      <Screen safeArea={false}>
        <TopBar title="Loading..." />
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Text color="$textMuted">Loading your list...</Text>
        </YStack>
      </Screen>
    );
  }

  // Error state
  if (initError) {
    return (
      <Screen safeArea={false}>
        <TopBar title="Error" />
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
          <Text color="$danger" textAlign="center">
            {initError.message}
          </Text>
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

        {displayItems.length === 0 && !isItemsLoading ? (
          <YStack flex={1} justifyContent="center" paddingBottom={100}>
            <EmptyState
              message="Your list is empty"
              description="Add your first item below"
            />
          </YStack>
        ) : (
          <FlatList
            data={displayItems}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={{ paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
          />
        )}

        <FixedBottomInput
          value={inputValue}
          onChangeText={setInputValue}
          onSubmit={handleAddItem}
          placeholder="Add item..."
          maxLength={MAX_TEXT_LENGTH}
          inputRef={inputRef}
        />

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
