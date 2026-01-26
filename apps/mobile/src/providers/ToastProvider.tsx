import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { Toast } from '@zusamn/ui';

interface ToastState {
  id: string;
  message: string;
  onUndo: () => void;
  /** Called when toast is dismissed without undo (timeout or replaced) */
  onFinalize?: () => void;
}

export interface ToastContextValue {
  /** Show undo toast. Returns toast ID. */
  showUndoToast: (options: {
    message: string;
    onUndo: () => void;
    onFinalize?: () => void;
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
 * - onFinalize runs synchronously; async work should handle its own errors
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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Store onFinalize in a ref to avoid stale closure issues
  const onFinalizeRef = useRef<(() => void) | undefined>(undefined);

  const clearTimeout_ = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const finalizeAndClear = useCallback(() => {
    clearTimeout_();
    // Call onFinalize if defined
    onFinalizeRef.current?.();
    onFinalizeRef.current = undefined;
    setToast(null);
  }, [clearTimeout_]);

  const showUndoToast = useCallback(
    (options: {
      message: string;
      onUndo: () => void;
      onFinalize?: () => void;
    }): string => {
      // If existing toast, finalize it first (previous action can no longer be undone)
      if (toast) {
        clearTimeout_();
        onFinalizeRef.current?.();
      }

      // Generate new ID
      const id = crypto.randomUUID();

      // Store new onFinalize in ref
      onFinalizeRef.current = options.onFinalize;

      // Set new toast state
      setToast({
        id,
        message: options.message,
        onUndo: options.onUndo,
        onFinalize: options.onFinalize,
      });

      // Start timeout - when it fires, finalize and clear
      timeoutRef.current = setTimeout(() => {
        onFinalizeRef.current?.();
        onFinalizeRef.current = undefined;
        setToast(null);
      }, TOAST_DURATION);

      return id;
    },
    [toast, clearTimeout_]
  );

  const dismissToast = useCallback(() => {
    if (toast) {
      finalizeAndClear();
    }
  }, [toast, finalizeAndClear]);

  const handleUndo = useCallback(() => {
    if (toast) {
      clearTimeout_();
      // Call onUndo, not onFinalize
      toast.onUndo();
      // Clear the onFinalize ref since we're undoing
      onFinalizeRef.current = undefined;
      setToast(null);
    }
  }, [toast, clearTimeout_]);

  const handleDismiss = useCallback(() => {
    // This is called by Toast when it auto-dismisses or is dismissed
    // We handle timer ourselves, so just finalize
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
        // Pass duration to keep Toast's internal timer in sync,
        // though we manage our own timer for finalization
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
