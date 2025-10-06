'use server';

import { summarizePdf, SummarizePdfInput } from '@/ai/flows/summarize-pdf';
import { getAuth } from 'firebase/auth';
import { getFirestore, addDoc, collection } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

type SummarizeResult = {
  summary?: string;
  error?: string;
};

export async function handleSummarizePdf(input: SummarizePdfInput): Promise<SummarizeResult> {
  try {
    const { auth, firestore } = initializeFirebase();
    const user = auth.currentUser;

    if (user) {
      const toolUsagesRef = collection(firestore, `users/${user.uid}/toolUsages`);
      addDoc(toolUsagesRef, {
        toolName: 'Smart Summary',
        usageTimestamp: new Date().toISOString(),
        documentId: '' // Document ID is not available here, but we can log the usage
      }).catch(error => {
        // Non-blocking, but we can still catch and create a contextual error
        const permissionError = new FirestorePermissionError({
            path: toolUsagesRef.path,
            operation: 'create',
            requestResourceData: {
              toolName: 'Smart Summary',
              usageTimestamp: new Date().toISOString(),
              documentId: ''
            }
        });
        // We can't use the global error emitter here on the server-side action,
        // but we can log it for server-side debugging.
        console.error("Firestore Permission Error (non-blocking):", permissionError.message);
      });
    }

    const result = await summarizePdf(input);
    return { summary: result.summary };
  } catch (e: any) {
    console.error('Summarization failed:', e);
    // In a real app, you might want to log this error to a monitoring service
    return { error: e.message || 'An unexpected error occurred during summarization.' };
  }
}
