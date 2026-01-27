import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { AppProvider } from '@zusamn/ui';
import { initFirebase } from '@zusamn/firebase';

/**
 * Root layout for the web app.
 * Initializes Firebase and provides the UI theme.
 *
 * This is a lightweight landing page app, not a full web app.
 * The primary use case is invite acceptance (Journey 6 in spec.md).
 */
export default function RootLayout() {
  useEffect(() => {
    initFirebase();
  }, []);

  return (
    <AppProvider>
      <Slot />
    </AppProvider>
  );
}
