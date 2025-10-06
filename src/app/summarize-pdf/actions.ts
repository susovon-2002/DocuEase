'use server';

import { summarizePdf, SummarizePdfInput } from '@/ai/flows/summarize-pdf';

type SummarizeResult = {
  summary?: string;
  error?: string;
};

export async function handleSummarizePdf(input: SummarizePdfInput): Promise<SummarizeResult> {
  try {
    const result = await summarizePdf(input);
    return { summary: result.summary };
  } catch (e: any) {
    console.error('Summarization failed:', e);
    // In a real app, you might want to log this error to a monitoring service
    return { error: e.message || 'An unexpected error occurred during summarization.' };
  }
}
