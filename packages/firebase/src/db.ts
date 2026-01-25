import type { Firestore } from 'firebase/firestore';
import { initFirebase } from './client';

/**
 * Gets the Firestore database instance.
 * Shared utility to avoid duplicating initFirebase() calls across hooks.
 */
export function getFirestoreDb(): Firestore {
  const { db } = initFirebase();
  return db;
}
