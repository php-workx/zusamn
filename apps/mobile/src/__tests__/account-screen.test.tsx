import React from 'react';
import { render } from '@testing-library/react-native';
import AccountScreen from '../../app/(tabs)/account';

const mockSignOut = jest.fn();

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

jest.mock('@zusamn/ui', () => {
  const React = require('react');
  const { Text, View, Pressable } = require('react-native');

  return {
    Screen: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    TopBar: ({ title }: { title: string }) => <Text>{title}</Text>,
    YStack: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    Text: ({ children }: { children: React.ReactNode }) => (
      <Text>{children}</Text>
    ),
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
    ConfirmDialog: ({ visible }: { visible: boolean }) =>
      visible ? <Text>Confirm</Text> : null,
  };
});

it('renders display name and action buttons', () => {
  const { getByText } = render(<AccountScreen />);

  expect(getByText('Test User')).toBeTruthy();
  expect(getByText('Logout')).toBeTruthy();
  expect(getByText('Delete Account')).toBeTruthy();
});
