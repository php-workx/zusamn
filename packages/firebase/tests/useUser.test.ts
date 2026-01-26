import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { useUser } from '../src/hooks/useUser';

const getDocMock = vi.fn();
const setDocMock = vi.fn();
const onSnapshotMock = vi.fn();
const docMock = vi.fn();
const serverTimestampMock = vi.fn();

vi.mock('../src/client', () => ({
  initFirebase: () => ({ db: {} }),
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => docMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
  serverTimestamp: () => serverTimestampMock(),
}));

beforeEach(() => {
  getDocMock.mockReset();
  setDocMock.mockReset();
  onSnapshotMock.mockReset();
  docMock.mockReset();
  serverTimestampMock.mockReset();
});

afterEach(() => {
  cleanup();
});

function TestComponent({ userId }: { userId: string | null }) {
  const { user, isLoading } = useUser(userId, { displayName: 'Test User', email: 'test@example.com' });
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
    getDocMock.mockResolvedValueOnce({ exists: () => false });
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
    expect(setDocMock).toHaveBeenCalledTimes(1);
  });
});
