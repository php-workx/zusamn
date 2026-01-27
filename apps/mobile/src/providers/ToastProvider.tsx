import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import * as Crypto from 'expo-crypto';
import { Toast } from '@zusamn/ui';

type ToastCallback = () => void | Promise<void>;

interface ToastState {
  id: string;
  message: string;
  onUndo: ToastCallback;
}

export interface ToastContextValue {
  /** Show undo toast. Returns toast ID. */
  showUndoToast: (options: {
    message: string;
    onUndo: ToastCallback;
    onFinalize?: ToastCallback;
  }) => string;
  /** Dismiss current toast (triggers finalize) */
  dismissToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION = 5000;

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * ToastProvider manages undo toasts for delete operations.
 *
 * Stacking behavior:
 * - Only one toast can be visible at a time
 * - If a new toast is shown while another is active, the previous toast is
 *   dismissed and its onFinalize callback is called (action cannot be undone)
 * - Toast auto-dismisses after 5 seconds
 * - Undo/finalize callbacks may be async; errors are caught and logged
 *
 * Usage:
 * ```tsx
 * // In App.tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 *
 * // In any component
 * const { showUndoToast } = useToast();
 *
 * const handleDelete = async (item: Item) => {
 *   // Optimistically remove from UI
 *   removeItemFromState(item.id);
 *
 *   showUndoToast({
 *     message: 'Item deleted',
 *     onUndo: () => {
 *       // Restore item in UI
 *       restoreItemToState(item);
 *     },
 *     onFinalize: async () => {
 *       // Actually delete from backend
 *       await deleteItemFromFirestore(item.id);
 *     },
 *   });
 * };
 * ```
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<ToastState | null>(null);
  // Track current toast in ref for immediate access (avoids stale closure in rapid succession)
  const toastRef = useRef<ToastState | null>(null);
  // Store onFinalize in a ref to avoid stale closure issues
  const onFinalizeRef = useRef<ToastCallback | undefined>(undefined);

  const runToastCallback = useCallback((callback: ToastCallback | undefined, label: string) => {
    if (!callback) return;
    try {
      Promise.resolve(callback()).catch((error) => {
        console.error(`Toast ${label} callback failed`, error);
      });
    } catch (error) {
      console.error(`Toast ${label} callback failed`, error);
    }
  }, []);

  const finalizeAndClear = useCallback(() => {
    // Call onFinalize if defined
    runToastCallback(onFinalizeRef.current, 'finalize');
    onFinalizeRef.current = undefined;
    toastRef.current = null;
    setToast(null);
  }, [runToastCallback]);

  const showUndoToast = useCallback(
    (options: {
      message: string;
      onUndo: ToastCallback;
      onFinalize?: ToastCallback;
    }): string => {
      // If existing toast, finalize it first (previous action can no longer be undone)
      // Use ref for immediate access - avoids stale closure when called in rapid succession
      if (toastRef.current) {
        runToastCallback(onFinalizeRef.current, 'finalize');
      }

      // Generate new ID using expo-crypto (crypto.randomUUID not available in RN)
      const id = Crypto.randomUUID();

      // Store new onFinalize in ref
      onFinalizeRef.current = options.onFinalize;

      // Create new toast state
      const newToast: ToastState = {
        id,
        message: options.message,
        onUndo: options.onUndo,
      };

      // Update both ref (immediate) and state (triggers render)
      toastRef.current = newToast;
      setToast(newToast);

      // Timer is managed by Toast component via duration prop
      // When Toast auto-dismisses, it calls onDismiss which triggers finalizeAndClear

      return id;
    },
    [runToastCallback] // Uses refs for immediate access
  );

  const dismissToast = useCallback(() => {
    if (toastRef.current) {
      finalizeAndClear();
    }
  }, [finalizeAndClear]);

  const handleUndo = useCallback(() => {
    if (toastRef.current) {
      // Call onUndo, not onFinalize
      runToastCallback(toastRef.current.onUndo, 'undo');
      // Clear the onFinalize ref since we're undoing
      onFinalizeRef.current = undefined;
      toastRef.current = null;
      setToast(null);
    }
  }, [runToastCallback]);

  const handleDismiss = useCallback(() => {
    // Called by Toast when it auto-dismisses after duration
    finalizeAndClear();
  }, [finalizeAndClear]);

  const value: ToastContextValue = {
    showUndoToast,
    dismissToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast
        message={toast?.message ?? ''}
        visible={!!toast}
        onDismiss={handleDismiss}
        onUndo={handleUndo}
        duration={TOAST_DURATION}
      />
    </ToastContext.Provider>
  );
}

/**
 * Hook to access toast context within components wrapped by ToastProvider.
 *
 * @throws Error if used outside of ToastProvider
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
