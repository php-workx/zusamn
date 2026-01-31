import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AccountScreen from '../../app/(tabs)/account';

const mockSignOut = jest.fn();
const mockDeleteAccount = jest.fn();
const mockNetInfoFetch = jest.fn();

jest.mock('../../src/providers', () => ({
  useAuthContext: () => ({
    user: {
      uid: 'user-1',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null,
      providerId: 'google.com',
    },
    isLoading: false,
    error: null,
    signOut: mockSignOut,
    signInWithGoogle: jest.fn(),
    signInWithApple: jest.fn(),
    updateDisplayName: jest.fn(),
    needsDisplayName: false,
  }),
}));

jest.mock('@zusamn/firebase', () => ({
  deleteAccount: (...args: unknown[]) => mockDeleteAccount(...args),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: () => mockNetInfoFetch(),
}));
jest.mock('@zusamn/ui', () => {
  const React = require('react');
  const { Text, View, Pressable } = require('react-native');

  return {
    Screen: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    TopBar: ({ title }: { title: string }) => <Text>{title}</Text>,
    YStack: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    Text: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
    PrimaryButton: ({
      children,
      onPress,
      disabled,
      loading,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
      disabled?: boolean;
      loading?: boolean;
    }) => (
      <Pressable onPress={disabled || loading ? undefined : onPress}>
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
      <Pressable onPress={disabled ? undefined : onPress}>
        <Text>{children}</Text>
      </Pressable>
    ),
    ConfirmDialog: ({
      visible,
      title,
      description,
      onCancel,
      onConfirm,
      cancelLabel = 'Cancel',
      confirmLabel = 'Confirm',
    }: {
      visible: boolean;
      title: string;
      description?: string;
      onCancel: () => void;
      onConfirm: () => void;
      cancelLabel?: string;
      confirmLabel?: string;
    }) =>
      visible ? (
        <View>
          <Text>{title}</Text>
          {description ? <Text>{description}</Text> : null}
          <Pressable onPress={onCancel}>
            <Text>{cancelLabel}</Text>
          </Pressable>
          <Pressable onPress={onConfirm}>
            <Text>{confirmLabel}</Text>
          </Pressable>
        </View>
      ) : null,
  };
});

describe('AccountScreen', () => {
  beforeEach(() => {
    mockSignOut.mockClear();
    mockDeleteAccount.mockClear();
    mockNetInfoFetch.mockReset();
  });

  it('renders display name and action buttons', () => {
    const { getByText } = render(<AccountScreen />);

    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('Logout')).toBeTruthy();
    expect(getByText('Delete Account')).toBeTruthy();
  });

  it('calls signOut when Logout is pressed', () => {
    const { getByText } = render(<AccountScreen />);

    fireEvent.press(getByText('Logout'));

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('blocks delete account when offline', async () => {
    mockNetInfoFetch.mockResolvedValueOnce({ isConnected: false });

    const { getByText, findByText } = render(<AccountScreen />);

    fireEvent.press(getByText('Delete Account'));

    expect(await findByText('Delete Account requires an internet connection.')).toBeTruthy();
    expect(mockDeleteAccount).not.toHaveBeenCalled();
  });

  it('confirms and calls deleteAccount when online', async () => {
    mockNetInfoFetch.mockResolvedValueOnce({ isConnected: true });
    mockDeleteAccount.mockResolvedValueOnce(undefined);

    const { getByText } = render(<AccountScreen />);

    fireEvent.press(getByText('Delete Account'));

    await waitFor(() => {
      expect(getByText('Delete your account?')).toBeTruthy();
    });

    fireEvent.press(getByText('Delete'));

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalledWith('user-1');
    });
  });

  it('shows error when deleteAccount fails', async () => {
    mockNetInfoFetch.mockResolvedValueOnce({ isConnected: true });
    mockDeleteAccount.mockRejectedValueOnce(new Error('Deletion failed'));

    const { getByText, findByText } = render(<AccountScreen />);

    fireEvent.press(getByText('Delete Account'));

    await waitFor(() => {
      expect(getByText('Delete your account?')).toBeTruthy();
    });

    fireEvent.press(getByText('Delete'));

    expect(await findByText('Deletion failed')).toBeTruthy();
  });

  it('dismisses the confirmation dialog on cancel', async () => {
    mockNetInfoFetch.mockResolvedValueOnce({ isConnected: true });

    const { getByText, queryByText } = render(<AccountScreen />);

    fireEvent.press(getByText('Delete Account'));

    await waitFor(() => {
      expect(getByText('Delete your account?')).toBeTruthy();
    });

    fireEvent.press(getByText('Cancel'));

    await waitFor(() => {
      expect(queryByText('Delete your account?')).toBeNull();
    });
    expect(mockDeleteAccount).not.toHaveBeenCalled();
  });
});
