'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-pdf.ts';
import '@/ai/flows/extract-tables.ts';
