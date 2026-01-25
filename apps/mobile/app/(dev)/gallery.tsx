import { useState, useCallback } from 'react';
import { ScrollView, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen,
  PrimaryButton,
  GhostButton,
  TextField,
  Toast,
  ConfirmDialog,
  SheetModal,
  Separator,
  EmptyState,
  Text,
  YStack,
  XStack,
  Theme,
} from '@zusamn/ui';

/**
 * Section header for gallery categories.
 */
function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      fontSize={13}
      fontWeight="600"
      color="$textMuted"
      marginTop="$4"
      marginBottom="$2"
      textTransform="uppercase"
    >
      {title}
    </Text>
  );
}

/**
 * Label for individual examples.
 */
function ExampleLabel({ label }: { label: string }) {
  return (
    <Text fontSize={13} color="$textMuted" marginBottom="$1">
      {label}
    </Text>
  );
}

/**
 * Gallery content component for a single theme mode.
 */
function GalleryContent({ themeLabel }: { themeLabel: string }) {
  const router = useRouter();

  // TextField state
  const [normalText, setNormalText] = useState('');
  const [focusedText, setFocusedText] = useState('');
  const [errorText, setErrorText] = useState('');
  const disabledText = 'Disabled input';

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [undoToastVisible, setUndoToastVisible] = useState(false);

  // ConfirmDialog state
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [destructiveConfirmVisible, setDestructiveConfirmVisible] = useState(false);

  // SheetModal state
  const [sheetVisible, setSheetVisible] = useState(false);

  const handleToastDismiss = useCallback(() => setToastVisible(false), []);
  const handleUndoToastDismiss = useCallback(() => setUndoToastVisible(false), []);
  const handleUndo = useCallback(() => {
    // Undo action placeholder
  }, []);

  return (
    <YStack flex={1}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* Header */}
        <YStack marginBottom="$4">
          <Text fontSize={20} fontWeight="600" color="$text">
            Component Gallery
          </Text>
          <Text fontSize={13} color="$textMuted">
            {themeLabel} mode - UI house components reference
          </Text>
        </YStack>

        {/* Back button */}
        <GhostButton onPress={() => router.back()}>Back</GhostButton>

        {/* ============= BUTTONS ============= */}
        <SectionHeader title="Buttons" />

        <YStack gap="$2">
          <ExampleLabel label="Primary Button (normal)" />
          <PrimaryButton onPress={() => {}}>Share</PrimaryButton>

          <ExampleLabel label="Primary Button (disabled)" />
          <PrimaryButton disabled>Share</PrimaryButton>

          <ExampleLabel label="Primary Button (loading)" />
          <PrimaryButton loading>Share</PrimaryButton>

          <ExampleLabel label="Ghost Button (normal)" />
          <GhostButton onPress={() => {}}>Cancel</GhostButton>

          <ExampleLabel label="Ghost Button (disabled)" />
          <GhostButton disabled>Cancel</GhostButton>

          <ExampleLabel label="Ghost Button (danger)" />
          <GhostButton danger onPress={() => {}}>
            Delete Account
          </GhostButton>
        </YStack>

        {/* ============= TEXT FIELDS ============= */}
        <SectionHeader title="TextField States" />

        <YStack gap="$3">
          <YStack>
            <ExampleLabel label="Normal" />
            <TextField
              value={normalText}
              onChangeText={setNormalText}
              placeholder="Add an item..."
              accessibilityLabel="Normal text field"
            />
          </YStack>

          <YStack>
            <ExampleLabel label="Focused (tap to focus)" />
            <TextField
              value={focusedText}
              onChangeText={setFocusedText}
              placeholder="Tap to focus..."
              accessibilityLabel="Focusable text field"
            />
          </YStack>

          <YStack>
            <ExampleLabel label="Error state" />
            <TextField
              value={errorText}
              onChangeText={setErrorText}
              placeholder="Enter text..."
              error="This field has an error"
              accessibilityLabel="Error text field"
            />
          </YStack>

          <YStack>
            <ExampleLabel label="200-item limit error" />
            <TextField
              value=""
              onChangeText={() => {}}
              placeholder="Add an item..."
              error="List full (200 items). Clear checked items to add more."
              accessibilityLabel="List full text field"
            />
          </YStack>

          <YStack>
            <ExampleLabel label="Disabled" />
            <TextField
              value={disabledText}
              onChangeText={() => {}}
              placeholder="Disabled..."
              disabled
              accessibilityLabel="Disabled text field"
            />
          </YStack>
        </YStack>

        {/* ============= TOAST ============= */}
        <SectionHeader title="Toast" />

        <YStack gap="$2">
          <ExampleLabel label="Simple toast" />
          <PrimaryButton onPress={() => setToastVisible(true)}>Show Toast</PrimaryButton>

          <ExampleLabel label="Toast with Undo action" />
          <PrimaryButton onPress={() => setUndoToastVisible(true)}>Show Undo Toast</PrimaryButton>
        </YStack>

        {/* ============= CONFIRM DIALOG ============= */}
        <SectionHeader title="ConfirmDialog" />

        <YStack gap="$2">
          <ExampleLabel label="Standard confirmation" />
          <PrimaryButton onPress={() => setConfirmVisible(true)}>Show Confirm Dialog</PrimaryButton>

          <ExampleLabel label="Destructive confirmation" />
          <GhostButton danger onPress={() => setDestructiveConfirmVisible(true)}>
            Show Destructive Dialog
          </GhostButton>
        </YStack>

        {/* ============= SHEET MODAL ============= */}
        <SectionHeader title="SheetModal" />

        <YStack gap="$2">
          <ExampleLabel label="Bottom sheet" />
          <PrimaryButton onPress={() => setSheetVisible(true)}>Open Sheet</PrimaryButton>
        </YStack>

        {/* ============= SEPARATOR ============= */}
        <SectionHeader title="Separator" />

        <YStack gap="$2">
          <ExampleLabel label="Full width" />
          <Separator />

          <ExampleLabel label="With inset (16px)" />
          <Separator inset={16} />
        </YStack>

        {/* ============= EMPTY STATE ============= */}
        <SectionHeader title="EmptyState" />

        <YStack
          height={200}
          borderWidth={1}
          borderColor="$separator"
          borderRadius={12}
          overflow="hidden"
        >
          <EmptyState message="Add your first item..." description="Your shopping list is empty" />
        </YStack>

        <YStack height="$4" />

        <YStack
          height={150}
          borderWidth={1}
          borderColor="$separator"
          borderRadius={12}
          overflow="hidden"
        >
          <EmptyState message="No items yet" />
        </YStack>

        {/* ============= NOTE ABOUT LISTROW ============= */}
        <SectionHeader title="ListRow" />
        <Text fontSize={13} color="$textMuted" fontStyle="italic">
          ListRow component not yet created - will be added when implemented.
        </Text>

        {/* Bottom padding for safe area */}
        <YStack height={100} />
      </ScrollView>

      {/* Toast overlays */}
      <Toast message="Link shared" visible={toastVisible} onDismiss={handleToastDismiss} />

      <Toast
        message="Item deleted"
        visible={undoToastVisible}
        onDismiss={handleUndoToastDismiss}
        onUndo={handleUndo}
      />

      {/* Confirm dialogs */}
      <ConfirmDialog
        title="Clear 5 checked items?"
        visible={confirmVisible}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => setConfirmVisible(false)}
        cancelLabel="Cancel"
        confirmLabel="Clear"
      />

      <ConfirmDialog
        title="Delete Account?"
        description="This permanently deletes your account and removes you from all lists."
        visible={destructiveConfirmVisible}
        onCancel={() => setDestructiveConfirmVisible(false)}
        onConfirm={() => setDestructiveConfirmVisible(false)}
        cancelLabel="Cancel"
        confirmLabel="Delete"
        destructive
      />

      {/* Sheet modal */}
      <SheetModal visible={sheetVisible} onClose={() => setSheetVisible(false)} title="Lists">
        <YStack gap="$2">
          <XStack
            padding="$3"
            backgroundColor="$surface"
            borderRadius={12}
            alignItems="center"
            justifyContent="space-between"
          >
            <Text fontSize={17} color="$text">
              Shopping
            </Text>
            <Text fontSize={13} color="$textMuted">
              Personal
            </Text>
          </XStack>
          <XStack
            padding="$3"
            backgroundColor="$surface"
            borderRadius={12}
            alignItems="center"
            justifyContent="space-between"
          >
            <Text fontSize={17} color="$text">
              Alex - Einkaufen
            </Text>
            <Text fontSize={13} color="$textMuted">
              Shared
            </Text>
          </XStack>
          <YStack height="$2" />
          <GhostButton onPress={() => setSheetVisible(false)}>Close</GhostButton>
        </YStack>
      </SheetModal>
    </YStack>
  );
}

/**
 * Component Gallery screen for visual verification of all house components.
 * Dev-only screen that displays:
 * - Buttons (primary/ghost)
 * - TextField states (normal/focused/error/disabled, incl. 200-item limit error)
 * - SheetModal examples
 * - Toast + Undo examples
 * - ConfirmDialog examples
 * - Separators and EmptyState
 *
 * Shows both light and dark mode variants for comparison.
 *
 * Note: ListRow is not included as it has not been created yet.
 */
export default function GalleryScreen() {
  const colorScheme = useColorScheme();
  const [showDualMode, setShowDualMode] = useState(false);

  if (showDualMode) {
    // Side-by-side or stacked light/dark comparison
    return (
      <Screen safeArea>
        <YStack flex={1}>
          <XStack padding="$4" justifyContent="space-between" alignItems="center">
            <Text fontSize={17} fontWeight="600" color="$text">
              Light/Dark Comparison
            </Text>
            <GhostButton onPress={() => setShowDualMode(false)}>Single Mode</GhostButton>
          </XStack>

          <ScrollView>
            <YStack gap="$4" padding="$2">
              {/* Light mode section */}
              <YStack borderWidth={1} borderColor="$separator" borderRadius={16} overflow="hidden">
                <Theme name="light">
                  <YStack backgroundColor="$bg" padding="$4">
                    <Text fontSize={17} fontWeight="600" color="$text" marginBottom="$2">
                      Light Mode
                    </Text>
                    <YStack gap="$2">
                      <PrimaryButton>Primary Button</PrimaryButton>
                      <GhostButton>Ghost Button</GhostButton>
                      <GhostButton danger>Danger Button</GhostButton>
                      <TextField value="" onChangeText={() => {}} placeholder="Text field..." />
                      <TextField
                        value=""
                        onChangeText={() => {}}
                        placeholder="Error field..."
                        error="Error message"
                      />
                      <Separator />
                      <YStack height={100}>
                        <EmptyState message="Empty state" />
                      </YStack>
                    </YStack>
                  </YStack>
                </Theme>
              </YStack>

              {/* Dark mode section */}
              <YStack borderWidth={1} borderColor="$separator" borderRadius={16} overflow="hidden">
                <Theme name="dark">
                  <YStack backgroundColor="$bg" padding="$4">
                    <Text fontSize={17} fontWeight="600" color="$text" marginBottom="$2">
                      Dark Mode
                    </Text>
                    <YStack gap="$2">
                      <PrimaryButton>Primary Button</PrimaryButton>
                      <GhostButton>Ghost Button</GhostButton>
                      <GhostButton danger>Danger Button</GhostButton>
                      <TextField value="" onChangeText={() => {}} placeholder="Text field..." />
                      <TextField
                        value=""
                        onChangeText={() => {}}
                        placeholder="Error field..."
                        error="Error message"
                      />
                      <Separator />
                      <YStack height={100}>
                        <EmptyState message="Empty state" />
                      </YStack>
                    </YStack>
                  </YStack>
                </Theme>
              </YStack>
            </YStack>
          </ScrollView>
        </YStack>
      </Screen>
    );
  }

  return (
    <Screen safeArea={false}>
      <YStack flex={1} paddingTop="$6">
        <XStack paddingHorizontal="$4" paddingBottom="$2" justifyContent="flex-end">
          <GhostButton onPress={() => setShowDualMode(true)}>Compare Light/Dark</GhostButton>
        </XStack>
        <GalleryContent themeLabel={colorScheme === 'dark' ? 'Dark' : 'Light'} />
      </YStack>
    </Screen>
  );
}
