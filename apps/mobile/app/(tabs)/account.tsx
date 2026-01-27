import { useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { deleteAccount } from '@zusamn/firebase';
import {
  ConfirmDialog,
  GhostButton,
  PrimaryButton,
  Screen,
  Text,
  TopBar,
  YStack,
} from '@zusamn/ui';
import { useAuthContext } from '../../src/providers';

/**
 * Account tab screen - placeholder for FR-NAV-003.
 * Shows user info and sign out option.
 */
export default function AccountScreen() {
  const { user, signOut } = useAuthContext();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePress = async () => {
    setDeleteError(null);
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      setDeleteError('Delete Account requires an internet connection.');
      return;
    }
    setConfirmVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!user) {
      setDeleteError('No authenticated user.');
      setConfirmVisible(false);
      return;
    }

    setConfirmVisible(false);
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount(user.uid);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete account.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Screen safeArea={false}>
      <TopBar title="Account" />
      <YStack flex={1} padding="$4" gap="$5">
        <YStack gap="$1">
          <Text fontSize="$3" color="$text">
            {user?.displayName || 'Unknown User'}
          </Text>
          <Text fontSize="$1" color="$textMuted">
            {user?.email || 'No email'}
          </Text>
        </YStack>

        <YStack gap="$3">
          <PrimaryButton onPress={() => void signOut()}>Logout</PrimaryButton>
          <GhostButton
            danger
            disabled={isDeleting || !user}
            onPress={() => void handleDeletePress()}
          >
            Delete Account
          </GhostButton>
          {deleteError ? (
            <Text fontSize="$1" color="$danger">
              {deleteError}
            </Text>
          ) : null}
        </YStack>
      </YStack>

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete your account?"
        description="This permanently deletes your account and personal list. Shared lists remain for other members."
        cancelLabel="Cancel"
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </Screen>
  );
}
