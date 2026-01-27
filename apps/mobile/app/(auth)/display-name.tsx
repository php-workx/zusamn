import { useState } from 'react';
import { useRouter } from 'expo-router';
import { PrimaryButton, Screen, Text, TextField, YStack } from '@zusamn/ui';
import { useAuthContext } from '../../src/providers';

/**
 * Display name prompt screen shown when social login does not provide a first name.
 * Implements FR-AUTH-007: System MUST prompt user for display name during onboarding.
 */
export default function DisplayNameScreen() {
  const router = useRouter();
  const { isLoading, error, updateDisplayName } = useAuthContext();
  const [displayName, setDisplayName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Note: Redirects are handled by AuthGuard in _layout.tsx

  const trimmedName = displayName.trim();
  const isValid = trimmedName.length > 0 && trimmedName.length <= 50;
  const validationError = trimmedName.length > 50 ? 'Name must be 50 characters or less' : null;

  const handleSave = async () => {
    // Guard against duplicate submissions from rapid taps
    if (isSaving || isLoading) return;

    if (!isValid) {
      setLocalError('Please enter a display name');
      return;
    }

    setLocalError(null);
    setIsSaving(true);
    try {
      await updateDisplayName(trimmedName);
      router.replace('/(tabs)');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to save display name');
    } finally {
      setIsSaving(false);
    }
  };

  const displayError = validationError || localError || error?.message;

  return (
    <Screen>
      <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
        <YStack alignItems="center" marginBottom="$6">
          <Text fontSize="$4" fontWeight="$2" color="$text">
            What should we call you?
          </Text>
          <Text fontSize="$1" color="$textMuted" marginTop="$2" textAlign="center">
            This name will be shown to others when you share lists.
          </Text>
        </YStack>

        <YStack width="100%" maxWidth={300} gap="$4">
          <TextField
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            accessibilityLabel="Display name"
            maxLength={50}
            autoFocus
            onSubmitEditing={handleSave}
            error={displayError ?? undefined}
          />

          <PrimaryButton
            onPress={handleSave}
            disabled={!isValid || isLoading || isSaving}
            loading={isSaving}
            accessibilityLabel="Save display name"
          >
            Continue
          </PrimaryButton>
        </YStack>
      </YStack>
    </Screen>
  );
}
