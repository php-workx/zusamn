import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  LayoutAnimation,
  type TextInput,
  type ListRenderItemInfo,
} from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import {
  EmptyState,
  GhostButton,
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
  getUserDisplayNames,
} from '@zusamn/firebase';
import { MAX_TEXT_LENGTH, MAX_ITEMS_PER_LIST } from '@zusamn/domain';
import type { Item } from '@zusamn/domain';
import { useAuthContext, useToast } from '../../src/providers';
import { useNetworkStatus, useLastUsedList } from '../../src/hooks';
import { FixedBottomInput, ShareSheet } from '../../src/components';

/**
 * List Detail screen - main screen for viewing and managing a shopping list.
 * Shows items, allows add/check/delete operations with offline support.
 */
export default function ListDetailScreen() {
  const { user } = useAuthContext();
  const { showUndoToast } = useToast();
  const { isConnected } = useNetworkStatus();
  const { hasPendingWrites, markWritePending } = useSyncStatus();
  const { getLastUsedListId, setLastUsedListId, clearLastUsedListId } = useLastUsedList();
  const showError = useCallback((message: string, error?: unknown) => {
    console.error(message, error);
    Alert.alert('Something went wrong', message);
  }, []);

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

  // Share sheet state
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Swipeable refs for closing
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  // Pending sink animation state - items waiting to move to checked section
  const [pendingSinkItemIds, setPendingSinkItemIds] = useState<Set<string>>(() => new Set());
  const sinkTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isInputFocusedRef = useRef(false);

  // Keep ref in sync with state for use in callbacks
  useEffect(() => {
    isInputFocusedRef.current = isInputFocused;
  }, [isInputFocused]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeouts = sinkTimeoutsRef.current;
    return () => {
      for (const timeout of timeouts.values()) {
        clearTimeout(timeout);
      }
      timeouts.clear();
    };
  }, []);

  // Firebase hooks
  const { user: firestoreUser } = useUser(user?.uid, {
    displayName: user?.displayName ?? undefined,
    email: user?.email ?? undefined,
  });
  const { list, isLoading: isListLoading } = useList(listId);
  const { membership } = useMembership(listId, user?.uid);
  const { items, isLoading: isItemsLoading, remotelyChangedIds } = useItems(listId);

  // Remote highlight state - item IDs currently highlighted
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(() => new Set());
  // Deferred remote changes to apply when input loses focus
  const deferredHighlightIdsRef = useRef<Set<string>>(new Set());
  // Timeouts for clearing highlights after 2000ms
  const highlightTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup highlight timeouts on unmount
  useEffect(() => {
    const timeouts = highlightTimeoutsRef.current;
    return () => {
      for (const timeout of timeouts.values()) {
        clearTimeout(timeout);
      }
      timeouts.clear();
    };
  }, []);

  // Apply highlight for an item ID (starts 2000ms timer to clear)
  const applyHighlight = useCallback((itemId: string) => {
    // Clear any existing timeout for this item
    const existingTimeout = highlightTimeoutsRef.current.get(itemId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Add to highlighted set
    setHighlightedIds((prev) => new Set(prev).add(itemId));

    // Start 2000ms timer to remove highlight
    const timeout = setTimeout(() => {
      setHighlightedIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      highlightTimeoutsRef.current.delete(itemId);
    }, 2000);

    highlightTimeoutsRef.current.set(itemId, timeout);
  }, []);

  // Apply all deferred highlights
  const applyDeferredHighlights = useCallback(() => {
    const deferred = deferredHighlightIdsRef.current;
    if (deferred.size > 0) {
      for (const itemId of deferred) {
        applyHighlight(itemId);
      }
      deferredHighlightIdsRef.current = new Set();
    }
  }, [applyHighlight]);

  // Handle remote changes - apply highlights immediately or defer if input is focused
  useEffect(() => {
    if (remotelyChangedIds.length === 0) return;

    for (const itemId of remotelyChangedIds) {
      if (isInputFocusedRef.current) {
        // Defer highlight while user is typing
        deferredHighlightIdsRef.current.add(itemId);
      } else {
        // Apply highlight immediately
        applyHighlight(itemId);
      }
    }
  }, [remotelyChangedIds, applyHighlight]);

  const ensurePersonalList = useCallback(async () => {
    if (!user?.uid || !firestoreUser) return;

    const existingList = await getPersonalList(user.uid);
    if (existingList) {
      setListId(existingList.list.id);
      setLastUsedListId(existingList.list.id);
      return;
    }

    const { list: newList } = await createPersonalList(user.uid, firestoreUser.locale);
    setListId(newList.id);
    setLastUsedListId(newList.id);
  }, [user?.uid, firestoreUser, setLastUsedListId]);

  // Initialize personal list on mount
  useEffect(() => {
    let active = true;

    async function initializeList() {
      if (!user?.uid || !firestoreUser) return;

      try {
        // Check for last used list first
        const lastListId = getLastUsedListId();
        if (lastListId) {
          if (active) {
            setListId(lastListId);
            setIsInitializing(false);
          }
          return;
        }

        await ensurePersonalList();
        if (active) {
          setIsInitializing(false);
        }
      } catch (error) {
        if (!active) return;
        setInitError(error instanceof Error ? error : new Error('Failed to initialize list'));
        setIsInitializing(false);
      }
    }

    initializeList();

    return () => {
      active = false;
    };
  }, [user?.uid, firestoreUser, getLastUsedListId, ensurePersonalList]);

  // Validate cached list ID and recover if it is no longer valid
  useEffect(() => {
    if (isInitializing || isListLoading) return;
    if (!listId || list) return;

    let active = true;

    const recoverList = async () => {
      try {
        clearLastUsedListId();
        await ensurePersonalList();
      } catch (error) {
        if (!active) return;
        setInitError(error instanceof Error ? error : new Error('Failed to recover list'));
      }
    };

    recoverList();

    return () => {
      active = false;
    };
  }, [listId, list, isInitializing, isListLoading, clearLastUsedListId, ensurePersonalList]);

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
    let count: number;
    try {
      count = typeof list?.itemCount === 'number' ? list.itemCount : await getItemCount(listId);
    } catch {
      // If we can't get the count, allow the add and let server enforce limit
      count = 0;
    }
    if (count >= MAX_ITEMS_PER_LIST) {
      Alert.alert(
        'List is full',
        `This list can hold up to ${MAX_ITEMS_PER_LIST} items. Delete some items to add more.`
      );
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
  }, [inputValue, listId, user?.uid, markWritePending, list?.itemCount]);

  // Start sink timer for a checked item
  const startSinkTimer = useCallback((itemId: string) => {
    // Clear any existing timer for this item
    const existingTimeout = sinkTimeoutsRef.current.get(itemId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Add to pending set
    setPendingSinkItemIds((prev) => new Set(prev).add(itemId));

    // Start 500ms timer to sink the item
    const timeout = setTimeout(() => {
      // Don't sink while user is typing
      if (isInputFocusedRef.current) {
        // Re-schedule when focus is lost (handled in onBlur)
        return;
      }

      // Remove from pending and trigger layout animation
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setPendingSinkItemIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      sinkTimeoutsRef.current.delete(itemId);
    }, 500);

    sinkTimeoutsRef.current.set(itemId, timeout);
  }, []);

  // Cancel sink timer for an item being unchecked
  const cancelSinkTimer = useCallback((itemId: string) => {
    const timeout = sinkTimeoutsRef.current.get(itemId);
    if (timeout) {
      clearTimeout(timeout);
      sinkTimeoutsRef.current.delete(itemId);
    }

    // Remove from pending and animate immediately back to unchecked position
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPendingSinkItemIds((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  }, []);

  // Handle check/uncheck
  const handleToggleChecked = useCallback(
    async (item: Item) => {
      if (!listId) return;

      const isBeingChecked = !item.checked;

      if (isBeingChecked) {
        // Start sink timer - item stays in unchecked section for 500ms
        startSinkTimer(item.id);
      } else {
        // Cancel any pending sink and move back immediately
        cancelSinkTimer(item.id);
      }

      markWritePending();
      try {
        await toggleItemChecked(listId, item.id);
      } catch {
        // On error, clean up the pending state
        if (isBeingChecked) {
          cancelSinkTimer(item.id);
        }
      }
    },
    [listId, markWritePending, startSinkTimer, cancelSinkTimer]
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
            try {
              markWritePending();
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
    [listId, markWritePending, showUndoToast, showError]
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
          try {
            markWritePending();
            await bulkUndelete(listId, itemIds);
          } catch (error) {
            showError('Unable to undo clear. Please try again.', error);
          }
        },
      });
    } catch {
      showError('Unable to clear checked items. Please try again.');
    }
  }, [listId, items, markWritePending, showUndoToast, showError]);

  // Handle opening share sheet - fetch member names
  const handleOpenShareSheet = useCallback(async () => {
    if (!list) return;

    setShowShareSheet(true);
    setIsLoadingMembers(true);

    try {
      const names = await getUserDisplayNames(list.memberIds);
      setMemberNames(names);
    } catch (error) {
      console.error('Failed to fetch member names:', error);
      setMemberNames([]);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [list]);

  // Handle share success - show toast
  const handleShareSuccess = useCallback(() => {
    // Show a simple toast by using the undo toast with a no-op
    // The user won't see the undo button because we close it quickly
    showUndoToast({
      message: 'Link shared',
      onUndo: () => {
        // No-op - sharing can't be undone
      },
    });
  }, [showUndoToast]);

  // Separate items into unchecked and checked
  // Items pending sink stay with unchecked items visually
  const uncheckedItems = items.filter((item) => !item.checked);
  const checkedItems = items.filter((item) => item.checked);

  // Items that are checked but still pending sink animation stay at top
  const pendingSinkItems = checkedItems.filter((item) => pendingSinkItemIds.has(item.id));
  const sunkCheckedItems = checkedItems.filter((item) => !pendingSinkItemIds.has(item.id));

  // Combine for display: unchecked first, then pending sink items, then fully sunk checked items
  const displayItems = [...uncheckedItems, ...pendingSinkItems, ...sunkCheckedItems];
  const checkedCount = checkedItems.length;

  // Handle input focus - pause sink timers while typing
  const handleInputFocus = useCallback(() => {
    setIsInputFocused(true);
  }, []);

  // Handle input blur - resume pending sink animations and apply deferred highlights
  const handleInputBlur = useCallback(() => {
    setIsInputFocused(false);

    // Apply deferred remote highlights
    applyDeferredHighlights();

    // Resume all pending sink timers
    if (pendingSinkItemIds.size > 0) {
      // Clear any outstanding timers before sinking
      for (const timeoutId of sinkTimeoutsRef.current.values()) {
        clearTimeout(timeoutId);
      }
      // After a brief delay, sink all pending items
      setTimeout(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setPendingSinkItemIds(new Set());
        sinkTimeoutsRef.current.clear();
      }, 100);
    }
  }, [pendingSinkItemIds, applyDeferredHighlights]);

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
      const isHighlighted = highlightedIds.has(item.id);
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
            highlighted={isHighlighted}
          />
        </Swipeable>
      );
    },
    [handleToggleChecked, handleDeleteItem, renderRightActions, highlightedIds]
  );

  // Key extractor
  const keyExtractor = useCallback((item: Item) => item.id, []);

  // Stable content container style (avoids re-renders from inline object)
  const flatListContentStyle = { paddingBottom: 100 };

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
          leftActions={
            <GhostButton onPress={handleOpenShareSheet} accessibilityLabel="Share list">
              Share
            </GhostButton>
          }
          rightActions={<OverflowMenu items={overflowMenuItems} />}
        />

        {displayItems.length === 0 && !isItemsLoading ? (
          <YStack flex={1} justifyContent="center" paddingBottom={100}>
            <EmptyState message="Your list is empty" description="Add your first item below" />
          </YStack>
        ) : (
          <FlatList
            data={displayItems}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={flatListContentStyle}
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
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
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

        {list && firestoreUser && (
          <ShareSheet
            visible={showShareSheet}
            onClose={() => setShowShareSheet(false)}
            list={list}
            currentUser={firestoreUser}
            memberNames={isLoadingMembers ? [] : memberNames}
            onShareSuccess={handleShareSuccess}
          />
        )}
      </Screen>
    </GestureHandlerRootView>
  );
}
