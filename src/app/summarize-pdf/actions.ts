'use server';

import { summarizePdf, SummarizePdfInput } from '@/ai/flows/summarize-pdf';

type SummarizeResult = {
  summary?: string;
  error?: string;
};

export async function handleSummarizePdf(input: SummarizePdfInput): Promise<SummarizeResult> {
  try {
    // Note: The Firestore logging part has been temporarily removed to fix a server-client boundary error.
    // In a real app, you would implement a proper server-side Firebase admin setup to handle this.
    const result = await summarizePdf(input);
    return { summary: result.summary };
  } catch (e: any) {
    console.error('Summarization failed:', e);
    return { error: e.message || 'An unexpected error occurred during summarization.' };
  }
}
