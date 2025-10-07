'use server';

/**
 * @fileOverview An AI agent to perform OCR on PDF documents.
 * 
 * - ocrPdf - A function that handles the OCR process.
 * - OcrPdfInput - The input type for the ocrPdf function.
 * - OcrPdfOutput - The return type for the ocrPdf function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OcrPdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      'The PDF document content as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
});
export type OcrPdfInput = z.infer<typeof OcrPdfInputSchema>;

const OcrPdfOutputSchema = z.object({
  text: z.string().describe('The recognized text from the PDF document.'),
});
export type OcrPdfOutput = z.infer<typeof OcrPdfOutputSchema>;

export async function ocrPdf(input: OcrPdfInput): Promise<OcrPdfOutput> {
  return ocrPdfFlow(input);
}

const prompt = ai.definePrompt({
  name: 'ocrPdfPrompt',
  input: {schema: OcrPdfInputSchema},
  output: {schema: OcrPdfOutputSchema},
  prompt: `You are an expert at extracting text from documents. You will receive the content of a PDF document. Perform OCR on the document and return all the text you can find.

Document: {{media url=pdfDataUri}}
`,
});

const ocrPdfFlow = ai.defineFlow(
  {
    name: 'ocrPdfFlow',
    inputSchema: OcrPdfInputSchema,
    outputSchema: OcrPdfOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
