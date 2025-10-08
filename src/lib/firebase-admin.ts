import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

export async function getAuthenticatedAppForUser() {
  if (getApps().length) {
    const firestore = getFirestore();
    return { firestore };
  }

  if (!serviceAccount) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT');
  }

  const app = initializeApp({
    credential: cert(serviceAccount),
  });

  const firestore = getFirestore(app);

  return { firestore };
}
