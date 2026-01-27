import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ListSwitcherSheet } from '../components/ListSwitcherSheet';

const mockUseUserLists = jest.fn();

jest.mock('@zusamn/firebase', () => ({
  useUserLists: (...args: unknown[]) => mockUseUserLists(...args),
}));

jest.mock('@zusamn/ui', () => {
  const React = require('react');
  const { Text, View, Pressable, FlatList } = require('react-native');

  return {
    SheetModal: ({
      visible,
      onClose,
      title,
      children,
    }: {
      visible: boolean;
      onClose: () => void;
      title: string;
      children: React.ReactNode;
    }) =>
      visible ? (
        <View testID="sheet-modal">
          <Text>{title}</Text>
          <Pressable onPress={onClose} testID="close-sheet">
            <Text>Close</Text>
          </Pressable>
          {children}
        </View>
      ) : null,
    Text: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
      <Text testID={testID}>{children}</Text>
    ),
    XStack: ({
      children,
      onPress,
      onLongPress,
      testID,
      accessibilityLabel,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
      onLongPress?: () => void;
      testID?: string;
      accessibilityLabel?: string;
    }) => (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    ),
    YStack: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    Separator: () => <View testID="separator" />,
  };
});

const createMockList = (
  id: string,
  ownerUserId: string,
  alias: string
): { list: { id: string; ownerUserId: string }; membership: { alias: string } } => ({
  list: { id, ownerUserId },
  membership: { alias },
});

describe('ListSwitcherSheet', () => {
  const mockOnClose = jest.fn();
  const mockOnSelectList = jest.fn();
  const mockOnRenameAlias = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSelectList.mockClear();
    mockOnRenameAlias.mockClear();
    mockUseUserLists.mockReset();
  });

  it('FR-SWITCH-005: shared lists display "shared" indicator', async () => {
    const lists = [
      createMockList('list-personal', 'user-1', 'My List'),
      createMockList('list-shared', 'user-2', 'Shared List'),
    ];
    mockUseUserLists.mockReturnValue({ lists, isLoading: false });

    const { getByText, queryByText, getAllByText } = render(
      <ListSwitcherSheet
        visible={true}
        onClose={mockOnClose}
        userId="user-1"
        currentListId="list-personal"
        onSelectList={mockOnSelectList}
      />
    );

    // Personal list should NOT have "shared" indicator
    expect(getByText('My List')).toBeTruthy();

    // Shared list should have "shared" indicator
    expect(getByText('Shared List')).toBeTruthy();
    // The "shared" text appears as an indicator for non-personal lists
    const sharedIndicators = getAllByText('shared');
    expect(sharedIndicators.length).toBe(1); // Only one shared list
  });

  it('FR-SWITCH-005: personal lists do not display "shared" indicator', async () => {
    const lists = [createMockList('list-personal', 'user-1', 'My List')];
    mockUseUserLists.mockReturnValue({ lists, isLoading: false });

    const { getByText, queryAllByText } = render(
      <ListSwitcherSheet
        visible={true}
        onClose={mockOnClose}
        userId="user-1"
        currentListId="list-personal"
        onSelectList={mockOnSelectList}
      />
    );

    expect(getByText('My List')).toBeTruthy();
    // No "shared" indicator for personal list
    const sharedIndicators = queryAllByText('shared');
    expect(sharedIndicators.length).toBe(0);
  });

  it('FR-SWITCH-006: tapping a list calls onSelectList with the list', async () => {
    const lists = [
      createMockList('list-personal', 'user-1', 'My List'),
      createMockList('list-shared', 'user-2', 'Shared List'),
    ];
    mockUseUserLists.mockReturnValue({ lists, isLoading: false });

    const { getByText } = render(
      <ListSwitcherSheet
        visible={true}
        onClose={mockOnClose}
        userId="user-1"
        currentListId="list-personal"
        onSelectList={mockOnSelectList}
      />
    );

    // Tap on the shared list
    fireEvent.press(getByText('Shared List'));

    // Should call onSelectList with the shared list
    expect(mockOnSelectList).toHaveBeenCalledTimes(1);
    expect(mockOnSelectList).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'list-shared', ownerUserId: 'user-2' })
    );
    // Should also close the sheet
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('FR-SWITCH-006: tapping navigates away from current list', async () => {
    const lists = [
      createMockList('list-personal', 'user-1', 'My List'),
      createMockList('list-shared', 'user-2', 'Shared List'),
    ];
    mockUseUserLists.mockReturnValue({ lists, isLoading: false });

    const { getByText } = render(
      <ListSwitcherSheet
        visible={true}
        onClose={mockOnClose}
        userId="user-1"
        currentListId="list-shared" // Currently on shared list
        onSelectList={mockOnSelectList}
      />
    );

    // Tap on personal list to switch
    fireEvent.press(getByText('My List'));

    expect(mockOnSelectList).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'list-personal', ownerUserId: 'user-1' })
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('FR-SWITCH-007: long-press triggers rename callback', async () => {
    const lists = [createMockList('list-personal', 'user-1', 'My List')];
    mockUseUserLists.mockReturnValue({ lists, isLoading: false });

    const { getByText } = render(
      <ListSwitcherSheet
        visible={true}
        onClose={mockOnClose}
        userId="user-1"
        currentListId="list-personal"
        onSelectList={mockOnSelectList}
        onRenameAlias={mockOnRenameAlias}
      />
    );

    // Long press on the list
    fireEvent(getByText('My List'), 'onLongPress');

    expect(mockOnRenameAlias).toHaveBeenCalledTimes(1);
    expect(mockOnRenameAlias).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'list-personal' }),
      'My List'
    );
  });

  it('shows loading state', () => {
    mockUseUserLists.mockReturnValue({ lists: [], isLoading: true });

    const { getByText } = render(
      <ListSwitcherSheet
        visible={true}
        onClose={mockOnClose}
        userId="user-1"
        currentListId={null}
        onSelectList={mockOnSelectList}
      />
    );

    expect(getByText('Loading lists...')).toBeTruthy();
  });

  it('shows empty state when no lists', () => {
    mockUseUserLists.mockReturnValue({ lists: [], isLoading: false });

    const { getByText } = render(
      <ListSwitcherSheet
        visible={true}
        onClose={mockOnClose}
        userId="user-1"
        currentListId={null}
        onSelectList={mockOnSelectList}
      />
    );

    expect(getByText('No lists found')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    mockUseUserLists.mockReturnValue({ lists: [], isLoading: false });

    const { queryByTestId } = render(
      <ListSwitcherSheet
        visible={false}
        onClose={mockOnClose}
        userId="user-1"
        currentListId={null}
        onSelectList={mockOnSelectList}
      />
    );

    expect(queryByTestId('sheet-modal')).toBeNull();
  });
});
