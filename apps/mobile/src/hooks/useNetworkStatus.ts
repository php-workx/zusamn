import { useEffect, useState } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  /** Whether the device has an active network connection */
  isConnected: boolean;
  /** Whether the internet is actually reachable (null = unknown) */
  isInternetReachable: boolean | null;
}

/**
 * Hook for tracking device network connectivity status.
 *
 * Uses @react-native-community/netinfo to monitor network state changes.
 * Defaults to connected: true until the first network check completes.
 *
 * Usage:
 * ```tsx
 * const { isConnected, isInternetReachable } = useNetworkStatus();
 *
 * if (!isConnected) {
 *   return <OfflineIndicator />;
 * }
 * ```
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    // Default to connected until first check
    isConnected: true,
    isInternetReachable: null,
  });

  useEffect(() => {
    let active = true;

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      if (!active) return;
      setStatus({
        // Treat null as disconnected for safety
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
      });
    });

    // Fetch initial network state
    NetInfo.fetch()
      .then((state: NetInfoState) => {
        if (!active) return;
        setStatus({
          isConnected: state.isConnected ?? false,
          isInternetReachable: state.isInternetReachable,
        });
      })
      .catch((error) => {
        if (!active) return;
        console.error('Failed to fetch network status', error);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return status;
}
