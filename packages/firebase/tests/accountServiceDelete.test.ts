import { describe, expect, it, vi, beforeEach } from 'vitest';
import { FirebaseError } from 'firebase/app';

const authMocks = vi.hoisted(() => {
  const deleteUserMock = vi.fn();
  const signOutMock = vi.fn();
  const updateDocMock = vi.fn();
  return { deleteUserMock, signOutMock, updateDocMock };
});

vi.mock('firebase/auth', () => ({
  deleteUser: authMocks.deleteUserMock,
}));

const writeBatchMock = vi.hoisted(() => ({
  delete: vi.fn(),
  update: vi.fn(),
  commit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: authMocks.updateDocMock,
  serverTimestamp: vi.fn(() => ({ __serverTimestamp: true })),
  // Additional mocks needed for deleteAccountWithDb cascade delete
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }), // No lists to clean up
  writeBatch: vi.fn(() => writeBatchMock),
  arrayRemove: vi.fn(),
  deleteDoc: vi.fn(),
}));

vi.mock('../src/auth', () => ({
  signOut: authMocks.signOutMock,
}));

vi.mock('../src/client', () => ({
  initFirebase: () => ({
    auth: { currentUser: { uid: 'user-1' } },
    db: { name: 'test-db' },
  }),
}));

import { deleteAccount } from '../src/services/accountService';

// FR-ACCT-005: Delete Account functionality
describe('accountService deleteAccount', () => {
  beforeEach(() => {
    authMocks.deleteUserMock.mockReset();
    authMocks.signOutMock.mockReset();
    authMocks.updateDocMock.mockReset();
  });

  it('throws on non-reauth errors without signing out (auth-first approach)', async () => {
    // With auth-first deletion, if Auth deletion fails, user account still exists
    // so we don't sign out - user can retry after resolving the issue
    const genericError = new Error('Network error');
    authMocks.deleteUserMock.mockRejectedValueOnce(genericError);

    await expect(deleteAccount('user-1')).rejects.toThrow('Network error');
    expect(authMocks.signOutMock).not.toHaveBeenCalled();
  });

  it('rethrows reauth-required errors without signing out', async () => {
    const reauthError = new FirebaseError('auth/requires-recent-login', 'Reauth');
    authMocks.deleteUserMock.mockRejectedValueOnce(reauthError);

    await expect(deleteAccount('user-1')).rejects.toThrow('Reauth');
    expect(authMocks.signOutMock).not.toHaveBeenCalled();
  });
});
