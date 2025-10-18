
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length > 0) {
    return getSdks(getApp());
  }

  // When deployed to Firebase Hosting, GOOGLE_CLOUD_PROJECT is set.
  // When deployed to Vercel, this will be undefined.
  if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    // This logic ensures that in a Vercel/Netlify/non-Firebase hosting environment,
    // the app initializes with the explicit config from .env.
    return getSdks(initializeApp(firebaseConfig));
  } else {
    // This handles Firebase Hosting's automatic initialization.
    // It will throw an error locally if not configured, which is expected.
    try {
      return getSdks(initializeApp());
    } catch(e) {
      console.error("Firebase automatic initialization failed. This is expected in local development. Falling back to explicit config.", e);
      // Fallback for local development or other environments where auto-init is expected but fails.
      return getSdks(initializeApp(firebaseConfig));
    }
  }
}

export function getSdks(firebaseApp: FirebaseApp) {
  const firestore = getFirestore(firebaseApp);
  try {
    enableIndexedDbPersistence(firestore).catch((err) => {
      if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled
        // in one tab at a time.
        // Silently fail here.
      } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence
        console.warn('Firestore persistence not available in this browser.');
      }
    });
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
        // This can happen with multiple tabs open.
    } else if (err.code !== 'already-started') {
        console.error('Error enabling Firestore persistence:', err);
    }
  }


  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
