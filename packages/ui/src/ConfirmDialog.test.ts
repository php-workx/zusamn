import React from 'react';
import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type PlatformOS = 'ios' | 'android';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const originalConsoleError = console.error;

beforeEach(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('react-test-renderer is deprecated')) {
      return;
    }
    originalConsoleError(...args);
  };
});

afterEach(() => {
  console.error = originalConsoleError;
});

const loadConfirmDialog = async (os: PlatformOS) => {
  vi.resetModules();
  const showActionSheetWithOptions = vi.fn();
  const alert = vi.fn();

  vi.doMock('react-native', () => ({
    ActionSheetIOS: { showActionSheetWithOptions },
    Alert: { alert },
    Platform: { OS: os },
  }));

  const { ConfirmDialog } = await import('./ConfirmDialog');

  return { ConfirmDialog, showActionSheetWithOptions, alert };
};

const render = (element: React.ReactElement) =>
  create(element as unknown as Parameters<typeof create>[0]);

describe('ConfirmDialog', () => {
  it('shows a native ActionSheet on iOS and triggers callbacks', async () => {
    const { ConfirmDialog, showActionSheetWithOptions } = await loadConfirmDialog('ios');
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    await act(async () => {
      render(
        React.createElement(ConfirmDialog, {
          visible: true,
          title: 'Delete your account?',
          description: 'This action cannot be undone.',
          cancelLabel: 'Cancel',
          confirmLabel: 'Delete',
          destructive: true,
          onCancel,
          onConfirm,
        })
      );
    });

    expect(showActionSheetWithOptions).toHaveBeenCalledTimes(1);
    const actionSheetCall = showActionSheetWithOptions.mock.calls[0];
    expect(actionSheetCall).toBeDefined();
    if (!actionSheetCall) {
      throw new Error('Expected ActionSheet to be called');
    }
    const [options, callback] = actionSheetCall;

    expect(options).toMatchObject({
      title: 'Delete your account?',
      message: 'This action cannot be undone.',
      options: ['Delete', 'Cancel'],
      cancelButtonIndex: 1,
      destructiveButtonIndex: 0,
    });

    callback(0);
    callback(1);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not present twice while visible remains true', async () => {
    const { ConfirmDialog, showActionSheetWithOptions } = await loadConfirmDialog('ios');
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    let renderer: ReturnType<typeof create> | undefined;

    await act(async () => {
      renderer = render(
        React.createElement(ConfirmDialog, {
          visible: true,
          title: 'Confirm',
          cancelLabel: 'Cancel',
          confirmLabel: 'Delete',
          onCancel,
          onConfirm,
        })
      );
    });

    await act(async () => {
      renderer?.update(
        React.createElement(ConfirmDialog, {
          visible: true,
          title: 'Confirm',
          cancelLabel: 'Cancel',
          confirmLabel: 'Delete',
          onCancel,
          onConfirm,
        }) as unknown as Parameters<typeof create>[0]
      );
    });

    expect(showActionSheetWithOptions).toHaveBeenCalledTimes(1);
  });

  it('shows a native Alert on Android and wires buttons', async () => {
    const { ConfirmDialog, alert } = await loadConfirmDialog('android');
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    await act(async () => {
      render(
        React.createElement(ConfirmDialog, {
          visible: true,
          title: 'Leave list?',
          description: 'You will lose access.',
          cancelLabel: 'Stay',
          confirmLabel: 'Leave',
          destructive: true,
          onCancel,
          onConfirm,
        })
      );
    });

    expect(alert).toHaveBeenCalledTimes(1);
    const alertCall = alert.mock.calls[0];
    expect(alertCall).toBeDefined();
    if (!alertCall) {
      throw new Error('Expected Alert to be called');
    }
    const [title, description, buttons, options] = alertCall;

    expect(title).toBe('Leave list?');
    expect(description).toBe('You will lose access.');
    expect(options).toMatchObject({ cancelable: true });

    const cancelButton = buttons?.[0];
    const confirmButton = buttons?.[1];

    cancelButton?.onPress?.();
    confirmButton?.onPress?.();
    options?.onDismiss?.();

    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
