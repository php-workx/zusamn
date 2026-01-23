import { useEffect } from "react";
import { initFirebase } from "@zusamn/firebase";
import { AppProvider, Button, Text, XStack, YStack } from "@zusamn/ui";

export default function App() {
  useEffect(() => {
    initFirebase();
  }, []);

  return (
    <AppProvider>
      <YStack flex={1} backgroundColor="#ffffff" paddingHorizontal={16} paddingVertical={24}>
        <YStack marginBottom={16}>
          <Text fontSize={24} fontWeight="700">
            Zusamn
          </Text>
          <Text color="#8e8e93">
            Shared shopping lists, ready to sync.
          </Text>
        </YStack>
        <YStack marginBottom={16} padding={16} backgroundColor="#f5f5f7" borderRadius={14}>
          <Text fontSize={16} fontWeight="600">
            Placeholder Screen
          </Text>
          <Text color="#8e8e93">
            Firebase init is wired. UI and data flows will land next.
          </Text>
        </YStack>
        <XStack>
          <Button backgroundColor="#007aff" color="#ffffff" marginRight={12}>
            Sign in
          </Button>
          <Button borderColor="#e5e5ea" borderWidth={1} color="#000000">
            Create list
          </Button>
        </XStack>
      </YStack>
    </AppProvider>
  );
}
