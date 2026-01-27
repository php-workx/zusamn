import { Screen, Text, YStack } from '@zusamn/ui';

/**
 * Home page for the web app.
 * This is a minimal placeholder since the primary purpose of the web app
 * is the invite landing page at /invite/[token].
 *
 * Users who land here directly can install the app from iOS/Android stores.
 */
export default function HomePage() {
  return (
    <Screen>
      <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
        <YStack alignItems="center" marginBottom="$6">
          <Text fontSize="$4" fontWeight="$2" color="$text">
            Zusamn
          </Text>
          <Text fontSize="$1" color="$textMuted" marginTop="$2" textAlign="center">
            Shared shopping lists, ready to sync.
          </Text>
        </YStack>

        <YStack
          width="100%"
          maxWidth={400}
          padding="$4"
          backgroundColor="$surface"
          borderRadius="$1"
          alignItems="center"
          gap="$3"
        >
          <Text fontSize="$2" fontWeight="$2" color="$text" textAlign="center">
            Get the app to start shopping
          </Text>
          <Text fontSize="$1" color="$textMuted" textAlign="center">
            Zusamn is available on iOS and Android.
          </Text>
        </YStack>
      </YStack>
    </Screen>
  );
}
