import { useState, useCallback, useEffect } from 'react';
import { Share, Alert } from 'react-native';
import {
  SheetModal,
  TextField,
  PrimaryButton,
  GhostButton,
  Separator,
  Text,
  YStack,
  XStack,
} from '@zusamn/ui';
import { generateInvite } from '@zusamn/firebase';
import { MAX_ALIAS_LENGTH, MAX_MEMBERS_PER_LIST } from '@zusamn/domain';
import type { List, User, Locale } from '@zusamn/domain';

export interface ShareSheetProps {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Called when the sheet should be closed */
  onClose: () => void;
  /** The list being shared */
  list: List;
  /** The current user */
  currentUser: User;
  /** Member names (display names of all members) */
  memberNames: string[];
  /** Called after successfully sharing */
  onShareSuccess: () => void;
}

/**
 * Returns the default share name based on locale.
 * Format: "<FirstName> - Shopping" or "<FirstName> - Einkaufen"
 */
function getDefaultShareName(displayName: string, locale: Locale): string {
  const firstName = displayName.split(' ')[0] || displayName || 'My';
  const listWord = locale === 'de' ? 'Einkaufen' : 'Shopping';
  return `${firstName} \u2013 ${listWord}`;
}

/**
 * Share sheet component for sharing a list with others.
 *
 * Handles:
 * - Editable share name with localized default
 * - "Link expires in 7 days" notice
 * - Generating invite link
 * - Opening OS share sheet
 * - Showing member names when list is full (3 members)
 */
export function ShareSheet({
  visible,
  onClose,
  list,
  currentUser,
  memberNames,
  onShareSuccess,
}: ShareSheetProps) {
  const [shareName, setShareName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if list is full (3 members max)
  const isListFull = list.memberIds.length >= MAX_MEMBERS_PER_LIST;

  // Reset share name when sheet opens
  useEffect(() => {
    if (visible) {
      setShareName(getDefaultShareName(currentUser.displayName, currentUser.locale));
    }
  }, [visible, currentUser.displayName, currentUser.locale]);

  const handleCreateInvite = useCallback(async () => {
    if (!shareName.trim() || isLoading) return;

    setIsLoading(true);

    try {
      // Generate invite link
      const inviteId = await generateInvite(
        list.id,
        shareName.trim(),
        currentUser.id
      );

      // Construct the invite URL
      const inviteUrl = `https://zusamn.com/invite/${inviteId}`;

      // Open OS share sheet
      const result = await Share.share({
        message: inviteUrl,
        url: inviteUrl, // iOS uses this for links
      });

      // Check if user actually shared (not dismissed)
      if (result.action === Share.sharedAction) {
        onShareSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Failed to create invite:', error);
      Alert.alert(
        'Unable to share',
        'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [shareName, isLoading, list.id, currentUser.id, onShareSuccess, onClose]);

  // Render content for full list (show member names)
  if (isListFull) {
    return (
      <SheetModal visible={visible} onClose={onClose} title="Share List">
        <YStack gap="$4">
          {/* Explanation */}
          <Text
            fontSize="$2"
            color="$textMuted"
            textAlign="center"
          >
            This list is full (maximum 3 people)
          </Text>

          <Separator />

          {/* Member names */}
          <YStack gap="$2">
            <Text
              fontSize="$1"
              fontWeight="$2"
              color="$textMuted"
              textAlign="center"
            >
              Current members:
            </Text>
            {memberNames.map((name, index) => (
              <Text
                key={list.memberIds[index] ?? `member-${index}`}
                fontSize="$2"
                color="$text"
                textAlign="center"
              >
                {name}
              </Text>
            ))}
          </YStack>

          <Separator />

          {/* Close button */}
          <GhostButton onPress={onClose}>
            Close
          </GhostButton>
        </YStack>
      </SheetModal>
    );
  }

  // Render normal share flow
  return (
    <SheetModal visible={visible} onClose={onClose} title="Share List">
      <YStack gap="$4">
        {/* Share name input */}
        <YStack gap="$2">
          <Text
            fontSize="$1"
            fontWeight="$2"
            color="$textMuted"
          >
            Share name
          </Text>
          <TextField
            value={shareName}
            onChangeText={setShareName}
            placeholder="Enter share name"
            maxLength={MAX_ALIAS_LENGTH}
            accessibilityLabel="Share name"
          />
        </YStack>

        {/* Expiry notice */}
        <XStack
          backgroundColor="$surface"
          padding="$3"
          borderRadius="$1"
          justifyContent="center"
        >
          <Text
            fontSize="$1"
            color="$textMuted"
            textAlign="center"
          >
            Link expires in 7 days
          </Text>
        </XStack>

        {/* Create invite button */}
        <PrimaryButton
          onPress={handleCreateInvite}
          disabled={!shareName.trim() || isLoading}
          loading={isLoading}
          accessibilityLabel="Create invite link"
        >
          Share
        </PrimaryButton>

        {/* Cancel button */}
        <GhostButton onPress={onClose} disabled={isLoading}>
          Cancel
        </GhostButton>
      </YStack>
    </SheetModal>
  );
}
