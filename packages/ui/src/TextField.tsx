import { Input, Text, YStack } from 'tamagui';

export interface TextFieldProps {
  /** Current value */
  value: string;
  /** Called when value changes */
  onChangeText: (text: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Error message to display below input */
  error?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Called when submit/return is pressed */
  onSubmitEditing?: () => void;
  /** Whether to auto-focus the input */
  autoFocus?: boolean;
  /** Maximum length of input */
  maxLength?: number;
}

/**
 * Text input field with error state support.
 * Used for add-item input, rename alias, share-name input.
 * Minimum touch target: 44px.
 */
export function TextField({
  value,
  onChangeText,
  placeholder,
  error,
  disabled = false,
  accessibilityLabel,
  onSubmitEditing,
  autoFocus = false,
  maxLength,
}: TextFieldProps) {
  return (
    <YStack gap="$1">
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="$placeholderColor"
        disabled={disabled}
        autoFocus={autoFocus}
        maxLength={maxLength}
        onSubmitEditing={onSubmitEditing}
        accessible
        accessibilityLabel={accessibilityLabel || placeholder}
        backgroundColor="$surface"
        borderRadius="$1"
        borderWidth={1}
        borderColor={error ? '$danger' : '$separator'}
        minHeight={44}
        paddingHorizontal="$4"
        fontSize="$2"
        color="$text"
        opacity={disabled ? 0.5 : 1}
      />
      {error && (
        <Text
          fontSize="$1"
          fontWeight="$1"
          color="$danger"
          paddingHorizontal="$4"
          accessible
          accessibilityRole="alert"
        >
          {error}
        </Text>
      )}
    </YStack>
  );
}
