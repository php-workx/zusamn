import { useEffect, useRef } from 'react';
import { ActionSheetIOS, Alert, Platform } from 'react-native';

export interface ConfirmDialogProps {
  /** Dialog title/message */
  title: string;
  /** Optional description */
  description?: string;
  /** Whether the dialog is visible */
  visible: boolean;
  /** Cancel action */
  onCancel: () => void;
  /** Confirm action */
  onConfirm: () => void;
  /** Label for cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Label for confirm button (default: "Confirm") */
  confirmLabel?: string;
  /** Whether confirm action is destructive */
  destructive?: boolean;
}

/**
 * Confirmation dialog for destructive actions.
 * iOS: native ActionSheet (bottom sheet with destructive red action)
 * Android: native Alert Dialog
 */
export function ConfirmDialog({
  title,
  description,
  visible,
  onCancel,
  onConfirm,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  destructive = false,
}: ConfirmDialogProps) {
  const presentedRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      presentedRef.current = false;
      return;
    }

    if (presentedRef.current) {
      return;
    }

    presentedRef.current = true;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title,
          message: description,
          options: [confirmLabel, cancelLabel],
          cancelButtonIndex: 1,
          destructiveButtonIndex: destructive ? 0 : undefined,
        },
        (buttonIndex: number) => {
          if (buttonIndex === 0) {
            onConfirm();
          } else {
            onCancel();
          }
        }
      );
      return;
    }

    Alert.alert(
      title,
      description,
      [
        { text: cancelLabel, style: 'cancel', onPress: onCancel },
        {
          text: confirmLabel,
          style: destructive ? 'destructive' : 'default',
          onPress: onConfirm,
        },
      ],
      { cancelable: true, onDismiss: onCancel }
    );
  }, [
    visible,
    title,
    description,
    cancelLabel,
    confirmLabel,
    destructive,
    onCancel,
    onConfirm,
  ]);

  return null;
}
