'use server';

/**
 * @fileOverview An AI agent to extract tables from a PDF into CSV format.
 * 
 * - extractTables - A function that handles the table extraction process.
 * - ExtractTablesInput - The input type for the extractTables function.
 * - ExtractTablesOutput - The return type for the extractTables function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTablesInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      'The PDF document content as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
});
export type ExtractTablesInput = z.infer<typeof ExtractTablesInputSchema>;

const ExtractTablesOutputSchema = z.object({
  csv: z.string().describe('The extracted table data in CSV format. If multiple tables exist, they should be concatenated with a double newline in between.'),
});
export type ExtractTablesOutput = z.infer<typeof ExtractTablesOutputSchema>;

export async function extractTables(input: ExtractTablesInput): Promise<ExtractTablesOutput> {
  return extractTablesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTablesPrompt',
  input: {schema: ExtractTablesInputSchema},
  output: {schema: ExtractTablesOutputSchema},
  model: 'gemini-pro',
  prompt: `You are an expert data extractor. Your task is to find all tables within the provided PDF document and convert them into a single CSV (Comma-Separated Values) format.

- Identify all tables in the document.
- For each table, correctly identify the header row and all data rows.
- Convert each table into standard CSV format. Use commas as delimiters. Enclose fields in double quotes if they contain commas or newlines.
- If there are multiple tables in the document, extract all of them. Separate the CSV data for each table with two newline characters (a blank line).
- If no tables are found, return an empty string for the csv field.

Document: {{media url=pdfDataUri}}
`,
});

const extractTablesFlow = ai.defineFlow(
  {
    name: 'extractTablesFlow',
    inputSchema: ExtractTablesInputSchema,
    outputSchema: ExtractTablesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
