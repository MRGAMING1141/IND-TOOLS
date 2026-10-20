import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with firestoreDatabaseId from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const ADMIN_EMAIL = 'janvirajpurohit491@gmail.com';
export const SECONDARY_ADMIN_EMAIL = 'lasthope.mr@gmail.com';

export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return normalized === ADMIN_EMAIL || normalized === SECONDARY_ADMIN_EMAIL;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test initial connection to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline check:', error.message);
    }
  }
}
testConnection();

// Check redirect result on load for redirect-based auth flow
getRedirectResult(auth)
  .then((result) => {
    if (result?.user) {
      console.log('Successfully signed in via redirect:', result.user.email);
    }
  })
  .catch((err) => {
    console.warn('Redirect login result error:', err);
  });

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    const isCancelled =
      error?.code === 'auth/user-cancelled' ||
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.message?.includes('auth/user-cancelled') ||
      error?.message?.includes('popup-closed-by-user');

    if (isCancelled) {
      console.warn('Google sign-in was dismissed or cancelled by user.');
      return null;
    }

    // If popup is blocked or fails on custom domains (like Vercel), fallback to redirect
    console.warn('Popup login failed, attempting redirect login fallback:', error?.message || error);
    try {
      await signInWithRedirect(auth, googleProvider);
      return null; // Will resolve after redirect return
    } catch (redirectErr: any) {
      console.error('Google redirect sign-in error:', redirectErr?.message || redirectErr);
      return null;
    }
  }
}

export async function loginWithEmail(email: string, pass: string) {
  try {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    return res.user;
  } catch (err: any) {
    console.error('Email sign-in error:', err);
    throw err;
  }
}

export async function registerWithEmail(email: string, pass: string) {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    return res.user;
  } catch (err: any) {
    console.error('Email registration error:', err);
    throw err;
  }
}

export async function logoutUser() {
  await signOut(auth);
}
