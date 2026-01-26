import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { useItems } from '../src/hooks/useItems';

const onSnapshotMock = vi.fn();
const collectionMock = vi.fn();
const queryMock = vi.fn();
const whereMock = vi.fn();
const orderByMock = vi.fn();

vi.mock('../src/client', () => ({
  initFirebase: () => ({ db: {} }),
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
  where: (...args: unknown[]) => whereMock(...args),
  orderBy: (...args: unknown[]) => orderByMock(...args),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
}));

beforeEach(() => {
  onSnapshotMock.mockReset();
  collectionMock.mockReset();
  queryMock.mockReset();
  whereMock.mockReset();
  orderByMock.mockReset();
});

afterEach(() => {
  cleanup();
});

function TestComponent({ listId }: { listId: string | null }) {
  const { items, isLoading } = useItems(listId);
  if (isLoading) {
    return React.createElement('div', { 'data-testid': 'state' }, 'loading');
  }
  return React.createElement(
    'div',
    { 'data-testid': 'state' },
    items.map((item) => item.id).join(',') || 'none'
  );
}

describe('useItems', () => {
  it('returns empty state when listId is null', () => {
    render(React.createElement(TestComponent, { listId: null }));
    expect(screen.getByTestId('state').textContent).toBe('none');
  });

  it('shows loading state before snapshot arrives', () => {
    onSnapshotMock.mockImplementation(() => vi.fn());

    render(React.createElement(TestComponent, { listId: 'list-1' }));

    expect(screen.getByTestId('state').textContent).toBe('loading');
  });

  it('maps items from snapshot', () => {
    onSnapshotMock.mockImplementation((_ref, onNext) => {
      onNext({
        docs: [
          {
            id: 'item-1',
            data: () => ({
              listId: 'list-1',
              text: 'Milk',
              checked: false,
              deleted: false,
              createdByUserId: 'user-1',
              serverCreatedAt: { toMillis: () => 10 },
              serverUpdatedAt: { toMillis: () => 11 },
            }),
          },
        ],
      });
      return vi.fn();
    });

    render(React.createElement(TestComponent, { listId: 'list-1' }));
    expect(screen.getByTestId('state').textContent).toBe('item-1');
  });
});
