import type { RefObject } from 'react';
import { Platform, KeyboardAvoidingView, StyleSheet, type TextInput } from 'react-native';
import { Input, XStack, YStack, Text } from '@zusamn/ui';

export interface FixedBottomInputProps {
  /** Current input value */
  value: string;
  /** Called when text changes */
  onChangeText: (text: string) => void;
  /** Called when submit button pressed or keyboard done */
  onSubmit: () => void;
  /** Placeholder text for input */
  placeholder?: string;
  /** Maximum character length (default: 100) */
  maxLength?: number;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Reference to input for programmatic focus */
  inputRef?: RefObject<TextInput>;
}

/**
 * Keyboard-aware input fixed at screen bottom.
 * Used for add-item input in list detail screen.
 * Stays above keyboard when active.
 */
export function FixedBottomInput({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Add item...',
  maxLength = 100,
  disabled = false,
  inputRef,
}: FixedBottomInputProps) {
  // Unified disabled state for consistency
  const isSubmitDisabled = disabled || !value.trim();

  const handleSubmit = () => {
    if (isSubmitDisabled) return;
    onSubmit();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      style={styles.container}
    >
      <YStack
        backgroundColor="$surface"
        borderTopWidth={0.5}
        borderTopColor="$separator"
        paddingHorizontal="$4" // 16px
        paddingVertical="$2" // 8px
        paddingBottom="$4" // Extra padding for safe area
      >
        <XStack
          alignItems="center"
          gap="$2" // 8px
        >
          {/* Input field */}
          <Input
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="$placeholderColor"
            maxLength={maxLength}
            disabled={disabled}
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
            blurOnSubmit={false}
            flex={1}
            backgroundColor="$bg"
            borderRadius="$1" // 12px
            borderWidth={1}
            borderColor="$separator"
            minHeight={44}
            paddingHorizontal="$4"
            fontSize="$2" // 17px
            color="$text"
            opacity={disabled ? 0.5 : 1}
            accessible
            accessibilityLabel={placeholder}
          />

          {/* Submit button */}
          <XStack
            minWidth={44}
            minHeight={44}
            backgroundColor="$accent"
            borderRadius="$1" // 12px
            alignItems="center"
            justifyContent="center"
            paddingHorizontal="$3" // 12px
            onPress={isSubmitDisabled ? undefined : handleSubmit}
            pressStyle={isSubmitDisabled ? undefined : { opacity: 0.8 }}
            opacity={isSubmitDisabled ? 0.5 : 1}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Add item"
            accessibilityState={{ disabled: isSubmitDisabled }}
          >
            <Text
              fontSize="$2" // 17px
              fontWeight="$2" // semibold
              color="$accentColor"
            >
              Add
            </Text>
          </XStack>
        </XStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
