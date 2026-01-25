import { useCallback, useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import { Text, YStack } from '@zusamn/ui';
import { MAX_TEXT_LENGTH, MAX_ITEMS_PER_LIST } from '@zusamn/domain';
import { addItem, getItemCount } from '@zusamn/firebase';
import { FixedBottomInput } from '../../components';

export interface AddItemInputProps {
  listId: string;
  userId: string;
  onWritePending: () => void;
}

/**
 * Add item input with validation.
 * - 100 char limit (MAX_TEXT_LENGTH)
 * - 200 item limit check with inline error (MAX_ITEMS_PER_LIST)
 * - Ignores whitespace-only submissions
 * - Keeps keyboard open after submit
 */
export function AddItemInput({ listId, userId, onWritePending }: AddItemInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null) as React.RefObject<TextInput>;

  const handleSubmit = useCallback(async () => {
    const text = inputValue.trim();
    if (!text) return;

    // Clear any previous error
    setError(null);

    // Check item limit
    try {
      const count = await getItemCount(listId);
      if (count >= MAX_ITEMS_PER_LIST) {
        setError(`This list has reached the maximum of ${MAX_ITEMS_PER_LIST} items. Delete some items to add more.`);
        return;
      }

      setInputValue('');
      onWritePending();

      await addItem(listId, text, userId);
    } catch (err) {
      // Restore input on error
      setInputValue(text);
      setError('Failed to add item. Please try again.');
    }
  }, [inputValue, listId, userId, onWritePending]);

  // Stable callback (rerender-functional-setstate)
  const handleChangeText = useCallback((text: string) => {
    setInputValue(text);
    setError((prev) => (prev ? null : prev));
  }, []);

  return (
    <YStack>
      {error && (
        <YStack
          backgroundColor="$danger"
          paddingHorizontal="$4"
          paddingVertical="$2"
          accessible
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          <Text color="white" fontSize="$1">
            {error}
          </Text>
        </YStack>
      )}
      <FixedBottomInput
        value={inputValue}
        onChangeText={handleChangeText}
        onSubmit={handleSubmit}
        placeholder="Add item..."
        maxLength={MAX_TEXT_LENGTH}
        inputRef={inputRef}
      />
    </YStack>
  );
}
