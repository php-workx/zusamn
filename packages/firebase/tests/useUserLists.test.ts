// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { useUserLists } from '../src/hooks/useUserLists';

const getUserListsMock = vi.fn();

vi.mock('../src/services', () => ({
  getUserLists: (...args: unknown[]) => getUserListsMock(...args),
}));

beforeEach(() => {
  getUserListsMock.mockReset();
});

afterEach(() => {
  cleanup();
});

function TestComponent({ userId }: { userId: string | undefined }) {
  const { lists, isLoading, error } = useUserLists(userId);

  if (isLoading) {
    return React.createElement('div', { 'data-testid': 'state' }, 'loading');
  }
  if (error) {
    return React.createElement('div', { 'data-testid': 'state' }, `error:${error.message}`);
  }
  if (lists.length === 0) {
    return React.createElement('div', { 'data-testid': 'state' }, 'empty');
  }
  return React.createElement(
    'div',
    { 'data-testid': 'state' },
    lists.map((l) => l.list.id).join(',')
  );
}

describe('useUserLists', () => {
  it('returns empty state when userId is undefined', async () => {
    render(React.createElement(TestComponent, { userId: undefined }));

    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toBe('empty');
    });
    expect(getUserListsMock).not.toHaveBeenCalled();
  });

  it('returns loading state initially', () => {
    getUserListsMock.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(React.createElement(TestComponent, { userId: 'user-1' }));

    expect(screen.getByTestId('state').textContent).toBe('loading');
  });

  it('returns lists when fetch succeeds', async () => {
    const mockLists = [
      {
        list: { id: 'list-personal', ownerUserId: 'user-1', memberIds: ['user-1'] },
        membership: { alias: 'My List', joinedAt: 1 },
      },
      {
        list: { id: 'list-shared', ownerUserId: 'user-2', memberIds: ['user-1', 'user-2'] },
        membership: { alias: 'Shared List', joinedAt: 2 },
      },
    ];

    getUserListsMock.mockResolvedValue(mockLists);

    render(React.createElement(TestComponent, { userId: 'user-1' }));

    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toBe('list-personal,list-shared');
    });
    expect(getUserListsMock).toHaveBeenCalledWith('user-1');
  });

  it('returns error when fetch fails', async () => {
    getUserListsMock.mockRejectedValue(new Error('Network error'));

    render(React.createElement(TestComponent, { userId: 'user-1' }));

    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toBe('error:Network error');
    });
  });

  it('refetches when userId changes', async () => {
    const mockLists1 = [
      {
        list: { id: 'list-1', ownerUserId: 'user-1', memberIds: ['user-1'] },
        membership: { alias: 'List 1', joinedAt: 1 },
      },
    ];
    const mockLists2 = [
      {
        list: { id: 'list-2', ownerUserId: 'user-2', memberIds: ['user-2'] },
        membership: { alias: 'List 2', joinedAt: 2 },
      },
    ];

    getUserListsMock.mockResolvedValueOnce(mockLists1).mockResolvedValueOnce(mockLists2);

    const { rerender } = render(React.createElement(TestComponent, { userId: 'user-1' }));

    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toBe('list-1');
    });

    rerender(React.createElement(TestComponent, { userId: 'user-2' }));

    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toBe('list-2');
    });

    expect(getUserListsMock).toHaveBeenCalledTimes(2);
  });
});
