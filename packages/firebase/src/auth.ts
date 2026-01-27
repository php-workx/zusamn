import {
  type Auth,
  type User as FirebaseUser,
  GoogleAuthProvider,
  OAuthProvider,
  type Unsubscribe,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { initFirebase } from './client';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerId: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Convert Firebase User to our AuthUser type
 */
function toAuthUser(firebaseUser: FirebaseUser): AuthUser {
  const providerData = firebaseUser.providerData[0];
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    providerId: providerData?.providerId ?? null,
  };
}

/**
 * Get the Firebase Auth instance
 */
export function getFirebaseAuth(): Auth {
  const { auth } = initFirebase();
  return auth;
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthStateChanged(
  callback: (user: AuthUser | null) => void
): Unsubscribe {
  const auth = getFirebaseAuth();
  return firebaseOnAuthStateChanged(auth, (firebaseUser) => {
    callback(firebaseUser ? toAuthUser(firebaseUser) : null);
  });
}

/**
 * Sign in with Google using an ID token from expo-auth-session.
 * The idToken should come from Google OAuth via expo-auth-session.
 */
export async function signInWithGoogle(idToken: string): Promise<AuthUser> {
  const auth = getFirebaseAuth();
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return toAuthUser(result.user);
}

/**
 * Sign in with Apple using an identity token from expo-auth-session.
 * The identityToken should come from Apple OAuth via expo-apple-authentication.
 */
export async function signInWithApple(
  identityToken: string,
  nonce?: string
): Promise<AuthUser> {
  const auth = getFirebaseAuth();
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: identityToken,
    rawNonce: nonce,
  });
  const result = await signInWithCredential(auth, credential);
  return toAuthUser(result.user);
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}

/**
 * Sign in with Google using a popup window.
 * This is the preferred method for web applications.
 */
export async function signInWithGooglePopup(): Promise<AuthUser> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return toAuthUser(result.user);
}

/**
 * Sign in with Apple using a popup window.
 * This is the preferred method for web applications.
 */
export async function signInWithApplePopup(): Promise<AuthUser> {
  const auth = getFirebaseAuth();
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  const result = await signInWithPopup(auth, provider);
  return toAuthUser(result.user);
}

/**
 * Check if a user needs to set up their display name.
 * Returns false for null user (no setup needed if not authenticated).
 * Returns true if user exists but displayName is null, empty, or whitespace-only.
 */
export function needsDisplayNameSetup(user: AuthUser | null): boolean {
  if (!user) return false;
  return !user.displayName || user.displayName.trim().length === 0;
}

/**
 * Get the current user synchronously (may be null if auth hasn't initialized)
 */
export function getCurrentUser(): AuthUser | null {
  const auth = getFirebaseAuth();
  return auth.currentUser ? toAuthUser(auth.currentUser) : null;
}

/**
 * Update the current user's display name.
 * Used when social login does not provide a first name.
 * Trims the input and rejects empty/whitespace-only names.
 */
export async function updateDisplayName(displayName: string): Promise<AuthUser> {
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user');
  }

  const trimmedName = displayName.trim();
  if (trimmedName.length === 0) {
    throw new Error('Display name cannot be empty');
  }

  await updateProfile(currentUser, { displayName: trimmedName });
  return toAuthUser(currentUser);
}
