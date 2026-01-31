// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useSyncStatus } from '../src/hooks/useSyncStatus';

const onSnapshotsInSyncMock = vi.fn();

vi.mock('../src/client', () => ({
  initFirebase: () => ({ db: {} }),
}));

vi.mock('firebase/firestore', () => ({
  onSnapshotsInSync: (...args: unknown[]) => onSnapshotsInSyncMock(...args),
}));

beforeEach(() => {
  onSnapshotsInSyncMock.mockReset();
});

afterEach(() => {
  cleanup();
});

function TestComponent() {
  const { hasPendingWrites, markWritePending } = useSyncStatus();
  return React.createElement(
    'div',
    null,
    React.createElement('div', { 'data-testid': 'state' }, hasPendingWrites ? 'syncing' : 'idle'),
    React.createElement(
      'button',
      { onClick: markWritePending, type: 'button', 'data-testid': 'button' },
      'mark'
    )
  );
}

describe('useSyncStatus', () => {
  it('toggles pending state when sync completes', async () => {
    let syncCallback: (() => void) | null = null;
    onSnapshotsInSyncMock.mockImplementation((_db, callback) => {
      syncCallback = callback;
      return vi.fn();
    });

    render(React.createElement(TestComponent));

    expect(screen.getByTestId('state').textContent).toBe('idle');
    fireEvent.click(screen.getByTestId('button'));
    expect(screen.getByTestId('state').textContent).toBe('syncing');

    await act(async () => {
      syncCallback?.();
    });
    expect(screen.getByTestId('state').textContent).toBe('idle');
  });
});
