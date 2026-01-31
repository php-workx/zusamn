import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { SheetModal, TextField, PrimaryButton, GhostButton, XStack, YStack } from '@zusamn/ui';
import { updateAlias } from '@zusamn/firebase';
import { MAX_ALIAS_LENGTH } from '@zusamn/domain';

export interface RenameAliasSheetProps {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Called when the sheet should be closed */
  onClose: () => void;
  /** The list ID being renamed */
  listId: string;
  /** The user ID */
  userId: string;
  /** The current alias value */
  currentAlias: string;
  /** Called after successful rename */
  onRenameSuccess?: () => void;
}

/**
 * Sheet for renaming a list's alias.
 * Each user has their own alias for a list - this only affects the current user.
 */
export function RenameAliasSheet({
  visible,
  onClose,
  listId,
  userId,
  currentAlias,
  onRenameSuccess,
}: RenameAliasSheetProps) {
  const [alias, setAlias] = useState(currentAlias);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when sheet opens
  useEffect(() => {
    if (visible) {
      setAlias(currentAlias);
      setError(null);
    }
  }, [visible, currentAlias]);

  const handleSave = useCallback(async () => {
    const trimmed = alias.trim();

    if (!trimmed) {
      setError('Name cannot be empty');
      return;
    }

    if (trimmed === currentAlias) {
      onClose();
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updateAlias(listId, userId, trimmed);
      onRenameSuccess?.();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to rename list';
      Alert.alert('Unable to rename', message);
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, [alias, currentAlias, listId, userId, onClose, onRenameSuccess]);

  return (
    <SheetModal visible={visible} onClose={onClose} title="Rename List">
      <YStack gap="$4">
        <TextField
          value={alias}
          onChangeText={setAlias}
          placeholder="List name"
          maxLength={MAX_ALIAS_LENGTH}
          autoFocus
          error={error ?? undefined}
          onSubmitEditing={handleSave}
        />

        <XStack gap="$3" justifyContent="flex-end">
          <GhostButton onPress={onClose} disabled={isSaving}>
            Cancel
          </GhostButton>
          <PrimaryButton
            onPress={handleSave}
            disabled={isSaving || !alias.trim()}
            loading={isSaving}
          >
            Save
          </PrimaryButton>
        </XStack>
      </YStack>
    </SheetModal>
  );
}
