import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AppProvider } from '@zusamn/ui';
import { AuthProvider, useAuthContext } from '../src/providers';

/**
 * Auth guard component that handles routing based on authentication state.
 * Redirects:
 * - Unauthenticated users to /login
 * - Users needing display name to /display-name
 * - Authenticated users away from auth screens to /(tabs)
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, needsDisplayName } = useAuthContext();
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while loading auth state
    if (isLoading) return;

    const firstSegment = segments[0];
    const secondSegment = segments[1];
    const inAuthGroup = firstSegment === '(auth)';

    if (!user) {
      // User is not authenticated - redirect to login if not already there
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (needsDisplayName) {
      // User needs to set display name - redirect if not on display-name screen
      const onDisplayNameScreen = inAuthGroup && secondSegment === 'display-name';
      if (!onDisplayNameScreen) {
        router.replace('/(auth)/display-name');
      }
    } else {
      // User is fully authenticated - redirect to tabs if in auth group
      if (inAuthGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [user, isLoading, needsDisplayName, segments, router]);

  return <>{children}</>;
}

/**
 * Root layout providing TamaguiProvider and AuthProvider wrappers.
 * Includes auth guard for routing based on authentication state.
 */
export default function RootLayout() {
  return (
    <AppProvider>
      <AuthProvider>
        <AuthGuard>
          <Slot />
        </AuthGuard>
      </AuthProvider>
    </AppProvider>
  );
}
