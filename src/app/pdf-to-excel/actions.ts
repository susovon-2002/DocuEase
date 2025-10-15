'use server';

import { extractTables, ExtractTablesInput } from '@/ai/flows/extract-tables';

type ExtractResult = {
  csv?: string;
  error?: string;
};

export async function handleExtractTables(input: ExtractTablesInput): Promise<ExtractResult> {
  try {
    const result = await extractTables(input);
    return { csv: result.csv };
  } catch (e: any) {
    console.error('Table extraction failed:', e);
    return { error: e.message || 'An unexpected error occurred during table extraction.' };
  }
}
