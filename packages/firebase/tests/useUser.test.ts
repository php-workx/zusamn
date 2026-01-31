// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { useUser } from '../src/hooks/useUser';

const runTransactionMock = vi.fn();
const transactionGetMock = vi.fn();
const transactionSetMock = vi.fn();
const onSnapshotMock = vi.fn();
const docMock = vi.fn();
const serverTimestampMock = vi.fn();

vi.mock('../src/client', () => ({
  initFirebase: () => ({ db: {} }),
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => docMock(...args),
  runTransaction: (...args: unknown[]) => runTransactionMock(...args),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
  serverTimestamp: () => serverTimestampMock(),
}));

beforeEach(() => {
  runTransactionMock.mockReset();
  transactionGetMock.mockReset();
  transactionSetMock.mockReset();
  onSnapshotMock.mockReset();
  docMock.mockReset();
  serverTimestampMock.mockReset();

  runTransactionMock.mockImplementation(
    async (
      _db: unknown,
      callback: (tx: {
        get: typeof transactionGetMock;
        set: typeof transactionSetMock;
      }) => Promise<void>
    ) => {
      // Return the callback result like Firebase's runTransaction does
      return callback({
        get: transactionGetMock,
        set: transactionSetMock,
      });
    }
  );
});

afterEach(() => {
  cleanup();
});

function TestComponent({ userId }: { userId: string | null }) {
  const { user, isLoading } = useUser(userId, {
    displayName: 'Test User',
    email: 'test@example.com',
  });
  if (isLoading) {
    return React.createElement('div', { 'data-testid': 'state' }, 'loading');
  }
  if (!user) {
    return React.createElement('div', { 'data-testid': 'state' }, 'none');
  }
  return React.createElement('div', { 'data-testid': 'state' }, user.displayName);
}

describe('useUser', () => {
  it('returns empty state when userId is null', () => {
    render(React.createElement(TestComponent, { userId: null }));
    expect(screen.getByTestId('state').textContent).toBe('none');
  });

  it('creates user doc when missing and returns snapshot', async () => {
    transactionGetMock.mockResolvedValueOnce({ exists: () => false });
    serverTimestampMock.mockReturnValue('server-time');
    onSnapshotMock.mockImplementation((_ref, onNext) => {
      onNext({
        exists: () => true,
        id: 'user-1',
        data: () => ({
          displayName: 'Test User',
          email: 'test@example.com',
          avatarUrl: null,
          locale: 'en',
          createdAt: { toMillis: () => 123 },
          deletedAt: null,
        }),
      });
      return vi.fn();
    });

    render(React.createElement(TestComponent, { userId: 'user-1' }));

    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toBe('Test User');
    });
    expect(transactionSetMock).toHaveBeenCalledTimes(1);
    // Verify the user data passed to transaction.set
    const setCallArgs = transactionSetMock.mock.calls[0] as unknown[];
    expect(setCallArgs[1]).toMatchObject({
      displayName: 'Test User',
      email: 'test@example.com',
    });
  });

  it('does not overwrite existing user doc', async () => {
    transactionGetMock.mockResolvedValueOnce({ exists: () => true });
    onSnapshotMock.mockImplementation((_ref, onNext) => {
      onNext({
        exists: () => true,
        id: 'user-1',
        data: () => ({
          displayName: 'Existing User',
          email: 'existing@example.com',
          avatarUrl: null,
          locale: 'en',
          createdAt: { toMillis: () => 123 },
          deletedAt: null,
        }),
      });
      return vi.fn();
    });

    render(React.createElement(TestComponent, { userId: 'user-1' }));

    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toBe('Existing User');
    });
    expect(transactionSetMock).not.toHaveBeenCalled();
  });
});
