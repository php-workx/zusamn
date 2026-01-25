import { Redirect, Stack } from 'expo-router';

/**
 * Dev group layout for development-only screens.
 * Used for Component Gallery and other dev tools.
 * Uses a simple stack navigation with no header.
 *
 * Gated to __DEV__ only - redirects to home in production builds.
 */
export default function DevLayout() {
  // Prevent access to dev routes in production builds
  if (!__DEV__) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
