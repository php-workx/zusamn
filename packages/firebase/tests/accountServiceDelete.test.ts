import { describe, expect, it, vi, beforeEach } from 'vitest';
import { FirebaseError } from 'firebase/app';
import type { User } from 'firebase/auth';

const deleteUserMock = vi.fn();
const signOutMock = vi.fn();
const initFirebaseMock = vi.fn();

vi.mock('../src/client', () => ({
  initFirebase: (...args: unknown[]) => initFirebaseMock(...args),
}));

vi.mock('../src/auth', () => ({
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

vi.mock('firebase/auth', () => ({
  deleteUser: (...args: unknown[]) => deleteUserMock(...args),
}));

vi.mock('firebase/firestore', () => ({
  arrayRemove: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  query: vi.fn(),
  where: vi.fn(),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
}));

const loadAccountService = async () => {
  vi.resetModules();
  return import('../src/services/accountService');
};

describe('deleteAccount', () => {
  const userId = 'user-1';
  const authUser = { uid: userId } as User;

  beforeEach(() => {
    deleteUserMock.mockReset();
    signOutMock.mockReset();
    initFirebaseMock.mockReset();
    initFirebaseMock.mockReturnValue({
      db: {},
      auth: { currentUser: authUser },
    });
  });

  it('deletes the auth user and signs out', async () => {
    const { deleteAccount } = await loadAccountService();

    await deleteAccount(userId);

    expect(deleteUserMock).toHaveBeenCalledWith(authUser);
    expect(signOutMock).toHaveBeenCalledTimes(1);
  });

  it('surfaces requires-recent-login without signing out', async () => {
    const { deleteAccount } = await loadAccountService();
    deleteUserMock.mockRejectedValueOnce(
      new FirebaseError('auth/requires-recent-login', 'Re-auth required')
    );

    await expect(deleteAccount(userId)).rejects.toMatchObject({
      code: 'auth/requires-recent-login',
    });
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it('signs out on non-reauth errors before rethrowing', async () => {
    const { deleteAccount } = await loadAccountService();
    const genericError = new Error('Network error');
    deleteUserMock.mockRejectedValueOnce(genericError);

    await expect(deleteAccount(userId)).rejects.toThrow('Network error');
    expect(signOutMock).toHaveBeenCalledTimes(1);
  });
});
