import { Stack } from 'expo-router';

/**
 * Dev group layout for development-only screens.
 * Used for Component Gallery and other dev tools.
 * Uses a simple stack navigation with no header.
 */
export default function DevLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
