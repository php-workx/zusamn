import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { RenameAliasSheet } from '../components/RenameAliasSheet';

const mockUpdateAlias = jest.fn();

jest.mock('@zusamn/firebase', () => ({
  updateAlias: (...args: unknown[]) => mockUpdateAlias(...args),
}));

jest.mock('@zusamn/domain', () => ({
  MAX_ALIAS_LENGTH: 50,
}));

jest.mock('@zusamn/ui', () => {
  const React = require('react');
  const { Text, View, Pressable, TextInput } = require('react-native');

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
          {children}
        </View>
      ) : null,
    TextField: ({
      value,
      onChangeText,
      placeholder,
      error,
      onSubmitEditing,
    }: {
      value: string;
      onChangeText: (text: string) => void;
      placeholder?: string;
      error?: string;
      onSubmitEditing?: () => void;
    }) => (
      <View>
        <TextInput
          testID="alias-input"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          onSubmitEditing={onSubmitEditing}
        />
        {error && <Text testID="error-text">{error}</Text>}
      </View>
    ),
    PrimaryButton: ({
      children,
      onPress,
      disabled,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
      disabled?: boolean;
    }) => (
      <Pressable onPress={disabled ? undefined : onPress} testID="save-button" disabled={disabled}>
        <Text>{children}</Text>
      </Pressable>
    ),
    GhostButton: ({
      children,
      onPress,
      disabled,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
      disabled?: boolean;
    }) => (
      <Pressable
        onPress={disabled ? undefined : onPress}
        testID="cancel-button"
        disabled={disabled}
      >
        <Text>{children}</Text>
      </Pressable>
    ),
    XStack: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    YStack: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('RenameAliasSheet', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    listId: 'list-1',
    userId: 'user-1',
    currentAlias: 'My List',
    onRenameSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders with current alias prefilled', () => {
    const { getByTestId } = render(<RenameAliasSheet {...defaultProps} />);

    expect(getByTestId('alias-input').props.value).toBe('My List');
  });

  it('does not render when not visible', () => {
    const { queryByTestId } = render(<RenameAliasSheet {...defaultProps} visible={false} />);

    expect(queryByTestId('sheet-modal')).toBeNull();
  });

  it('calls onClose when Cancel is pressed', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(<RenameAliasSheet {...defaultProps} onClose={onClose} />);

    fireEvent.press(getByTestId('cancel-button'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows error when trying to save empty alias via keyboard submit', async () => {
    const { getByTestId } = render(<RenameAliasSheet {...defaultProps} />);

    // Clear the input and submit via keyboard (bypasses disabled button)
    fireEvent.changeText(getByTestId('alias-input'), '   ');
    fireEvent(getByTestId('alias-input'), 'onSubmitEditing');

    await waitFor(() => {
      expect(getByTestId('error-text').props.children).toBe('Name cannot be empty');
    });
    expect(mockUpdateAlias).not.toHaveBeenCalled();
  });

  it('closes without saving when alias unchanged', async () => {
    const onClose = jest.fn();
    const { getByTestId } = render(<RenameAliasSheet {...defaultProps} onClose={onClose} />);

    // Don't change the alias, just save
    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(mockUpdateAlias).not.toHaveBeenCalled();
  });

  it('calls updateAlias and onRenameSuccess on successful save', async () => {
    mockUpdateAlias.mockResolvedValue(undefined);
    const onClose = jest.fn();
    const onRenameSuccess = jest.fn();

    const { getByTestId } = render(
      <RenameAliasSheet {...defaultProps} onClose={onClose} onRenameSuccess={onRenameSuccess} />
    );

    fireEvent.changeText(getByTestId('alias-input'), 'New Name');
    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => {
      expect(mockUpdateAlias).toHaveBeenCalledWith('list-1', 'user-1', 'New Name');
    });
    expect(onRenameSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows Alert on save error', async () => {
    mockUpdateAlias.mockRejectedValue(new Error('Network error'));

    const { getByTestId } = render(<RenameAliasSheet {...defaultProps} />);

    fireEvent.changeText(getByTestId('alias-input'), 'New Name');
    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Unable to rename', 'Network error');
    });
  });

  it('trims whitespace from alias before saving', async () => {
    mockUpdateAlias.mockResolvedValue(undefined);

    const { getByTestId } = render(<RenameAliasSheet {...defaultProps} />);

    fireEvent.changeText(getByTestId('alias-input'), '  Trimmed Name  ');
    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => {
      expect(mockUpdateAlias).toHaveBeenCalledWith('list-1', 'user-1', 'Trimmed Name');
    });
  });

  it('resets state when sheet becomes visible', async () => {
    const { getByTestId, rerender } = render(
      <RenameAliasSheet {...defaultProps} visible={false} />
    );

    // Rerender with visible=true and different currentAlias
    rerender(<RenameAliasSheet {...defaultProps} visible={true} currentAlias="Updated Alias" />);

    await waitFor(() => {
      expect(getByTestId('alias-input').props.value).toBe('Updated Alias');
    });
  });

  it('handles submit via keyboard', async () => {
    mockUpdateAlias.mockResolvedValue(undefined);

    const { getByTestId } = render(<RenameAliasSheet {...defaultProps} />);

    fireEvent.changeText(getByTestId('alias-input'), 'Keyboard Submit');
    fireEvent(getByTestId('alias-input'), 'onSubmitEditing');

    await waitFor(() => {
      expect(mockUpdateAlias).toHaveBeenCalledWith('list-1', 'user-1', 'Keyboard Submit');
    });
  });
});
