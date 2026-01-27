import { useEffect, useRef } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AppProvider } from '@zusamn/ui';
import { AuthProvider, ToastProvider, useAuthContext } from '../src/providers';
import { usePendingInvite } from '../src/hooks';

/**
 * Auth guard component that handles routing based on authentication state.
 * Redirects:
 * - Unauthenticated users to /login (unless on invite screen)
 * - Users needing display name to /display-name
 * - Authenticated users away from auth screens to /(tabs) or pending invite
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, needsDisplayName } = useAuthContext();
  const segments = useSegments() as string[];
  const router = useRouter();
  const { getPendingInvite, clearPendingInvite } = usePendingInvite();

  // Track if we've already handled a pending invite this session
  const pendingInviteHandled = useRef(false);

  useEffect(() => {
    // Don't redirect while loading auth state
    if (isLoading) return;

    const firstSegment = segments[0];
    const secondSegment = segments[1];
    const inAuthGroup = firstSegment === '(auth)';
    const onInviteScreen = firstSegment === 'invite';

    if (!user) {
      // User is not authenticated
      // Allow invite screen to handle its own auth flow
      if (onInviteScreen) {
        return;
      }
      // Redirect to login from anywhere else
      // Also redirect from display-name since it requires an authenticated user
      if (!inAuthGroup || secondSegment === 'display-name') {
        router.replace('/(auth)/login');
      }
    } else if (needsDisplayName) {
      // User needs to set display name - redirect if not on display-name screen
      const onDisplayNameScreen = inAuthGroup && secondSegment === 'display-name';
      if (!onDisplayNameScreen) {
        router.replace('/(auth)/display-name');
      }
    } else {
      // User is fully authenticated
      // Check for pending invite (from pre-auth invite link)
      if (!pendingInviteHandled.current) {
        const pendingToken = getPendingInvite();
        if (pendingToken) {
          pendingInviteHandled.current = true;
          clearPendingInvite();
          router.replace(`/invite/${pendingToken}`);
          return;
        }
      }

      // Redirect to tabs if in auth group (login/display-name completed)
      if (inAuthGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [
    user,
    isLoading,
    needsDisplayName,
    segments,
    router,
    getPendingInvite,
    clearPendingInvite,
  ]);

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
        <ToastProvider>
          <AuthGuard>
            <Slot />
          </AuthGuard>
        </ToastProvider>
      </AuthProvider>
    </AppProvider>
  );
}
