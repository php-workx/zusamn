// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { useMembership } from '../src/hooks/useMembership';

const onSnapshotMock = vi.fn();
const docMock = vi.fn();

vi.mock('../src/client', () => ({
  initFirebase: () => ({ db: {} }),
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => docMock(...args),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
}));

beforeEach(() => {
  onSnapshotMock.mockReset();
  docMock.mockReset();
});

afterEach(() => {
  cleanup();
});

function TestComponent({ listId, userId }: { listId: string | null; userId: string | null }) {
  const { membership, isLoading } = useMembership(listId, userId);
  if (isLoading) {
    return React.createElement('div', { 'data-testid': 'state' }, 'loading');
  }
  if (!membership) {
    return React.createElement('div', { 'data-testid': 'state' }, 'none');
  }
  return React.createElement('div', { 'data-testid': 'state' }, membership.alias);
}

describe('useMembership', () => {
  it('returns empty state when listId or userId missing', () => {
    render(React.createElement(TestComponent, { listId: null, userId: 'user-1' }));
    expect(screen.getByTestId('state').textContent).toBe('none');
  });

  it('returns membership from snapshot', () => {
    onSnapshotMock.mockImplementation((_ref, onNext) => {
      onNext({
        exists: () => true,
        id: 'user-1',
        data: () => ({
          listId: 'list-1',
          alias: 'Groceries',
          joinedAt: { toMillis: () => 50 },
        }),
      });
      return vi.fn();
    });

    render(React.createElement(TestComponent, { listId: 'list-1', userId: 'user-1' }));
    expect(screen.getByTestId('state').textContent).toBe('Groceries');
  });
});
