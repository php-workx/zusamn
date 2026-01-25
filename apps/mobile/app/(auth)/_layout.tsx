import { Stack } from 'expo-router';

/**
 * Auth group layout for login and onboarding screens.
 * Uses a simple stack navigation with no header.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    />
  );
}
