import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { useList } from '../src/hooks/useList';

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

function TestComponent({ listId }: { listId: string | null }) {
  const { list, isLoading } = useList(listId);
  if (isLoading) {
    return React.createElement('div', { 'data-testid': 'state' }, 'loading');
  }
  if (!list) {
    return React.createElement('div', { 'data-testid': 'state' }, 'none');
  }
  return React.createElement('div', { 'data-testid': 'state' }, list.id);
}

describe('useList', () => {
  it('returns empty state when listId is null', () => {
    render(React.createElement(TestComponent, { listId: null }));
    expect(screen.getByTestId('state').textContent).toBe('none');
  });

  it('returns list data when snapshot exists', () => {
    onSnapshotMock.mockImplementation((_ref, onNext) => {
      onNext({
        exists: () => true,
        id: 'list-1',
        data: () => ({
          ownerUserId: 'user-1',
          memberIds: ['user-1'],
          createdAt: { toMillis: () => 100 },
        }),
      });
      return vi.fn();
    });

    render(React.createElement(TestComponent, { listId: 'list-1' }));

    expect(screen.getByTestId('state').textContent).toBe('list-1');
    expect(docMock).toHaveBeenCalled();
  });
});
