import type { LucideIcon } from 'lucide-react';
import {
  Combine,
  Scissors,
  Minimize2,
  Wrench,
  Gauge,
  ScanLine,
  ScanText,
  FileImage,
  FileText,
  FilePieChart,
  FileSpreadsheet,
  FileCode,
  RotateCw,
  Hash,
  Paintbrush,
  Crop,
  FilePenLine,
  LockOpen,
  Lock,
  PenLine,
  EyeOff,
  GitCompareArrows,
  Sparkles,
  BookDown
} from 'lucide-react';

export type Tool = {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  category: string;
};

export const tools: Tool[] = [
  // Organize PDF
  {
    title: 'Merge PDF',
    description: 'Combine multiple PDFs into one document.',
    icon: Combine,
    path: '/merge-pdf',
    category: 'Organize PDF',
  },
  {
    title: 'Split PDF',
    description: 'Divide a single PDF into multiple files.',
    icon: Scissors,
    path: '/split-pdf',
    category: 'Organize PDF',
  },
  {
    title: 'Remove Pages',
    description: 'Delete specific pages from a PDF.',
    icon: EyeOff, // Using EyeOff as a substitute for a remove page icon
    path: '/remove-pages',
    category: 'Organize PDF',
  },
  {
    title: 'Extract Pages',
    description: 'Create a new PDF from selected pages.',
    icon: GitCompareArrows, // Using GitCompareArrows as a substitute
    path: '/extract-pages',
    category: 'Organize PDF',
  },
  // Optimize PDF
  {
    title: 'Compress PDF',
    description: 'Reduce the file size of your PDF.',
    icon: Minimize2,
    path: '/compress-pdf',
    category: 'Optimize PDF',
  },
  {
    title: 'Repair PDF',
    description: 'Fix corrupted or damaged PDF files.',
    icon: Wrench,
    path: '/repair-pdf',
    category: 'Optimize PDF',
  },
  {
    title: 'OCR PDF',
    description: 'Make scanned text searchable and selectable.',
    icon: ScanText,
    path: '/ocr-pdf',
    category: 'Optimize PDF',
  },
  {
    title: 'Optimize PDF',
    description: 'Enhance PDF for faster web view.',
    icon: Gauge,
    path: '/optimize-pdf',
    category: 'Optimize PDF',
  },
   {
    title: 'Scan to PDF',
    description: 'Convert scanner output to a PDF file.',
    icon: ScanLine,
    path: '/scan-to-pdf',
    category: 'Optimize PDF',
  },
  // Convert to PDF
  {
    title: 'JPG to PDF',
    description: 'Convert JPG images to a PDF document.',
    icon: FileImage,
    path: '/jpg-to-pdf',
    category: 'Convert to PDF',
  },
  {
    title: 'WORD to PDF',
    description: 'Convert Word documents to PDF.',
    icon: FileText,
    path: '/word-to-pdf',
    category: 'Convert to PDF',
  },
  {
    title: 'POWERPOINT to PDF',
    description: 'Convert PowerPoint presentations to PDF.',
    icon: FilePieChart,
    path: '/powerpoint-to-pdf',
    category: 'Convert to PDF',
  },
  {
    title: 'EXCEL to PDF',
    description: 'Convert Excel spreadsheets to PDF.',
    icon: FileSpreadsheet,
    path: '/excel-to-pdf',
    category: 'Convert to PDF',
  },
  {
    title: 'HTML to PDF',
    description: 'Convert web pages to PDF.',
    icon: FileCode,
    path: '/html-to-pdf',
    category: 'Convert to PDF',
  },
  // Convert from PDF
  {
    title: 'PDF to JPG',
    description: 'Convert PDF pages to JPG images.',
    icon: FileImage,
    path: '/pdf-to-jpg',
    category: 'Convert from PDF',
  },
  {
    title: 'PDF to WORD',
    description: 'Convert PDF to editable Word documents.',
    icon: FileText,
    path: '/pdf-to-word',
    category: 'Convert from PDF',
  },
  {
    title: 'PDF to POWERPOINT',
    description: 'Convert PDF to PowerPoint presentations.',
    icon: FilePieChart,
    path: '/pdf-to-powerpoint',
    category: 'Convert from PDF',
  },
  {
    title: 'PDF to EXCEL',
    description: 'Extract data from PDF to Excel.',
    icon: FileSpreadsheet,
    path: '/pdf-to-excel',
    category: 'Convert from PDF',
  },
  {
    title: 'PDF to PDF/A',
    description: 'Convert PDF to an archival format.',
    icon: BookDown,
    path: '/pdf-to-pdfa',
    category: 'Convert from PDF',
  },
  // Edit PDF
  {
    title: 'Rotate PDF',
    description: 'Turn pages in your PDF document.',
    icon: RotateCw,
    path: '/rotate-pdf',
    category: 'Edit PDF',
  },
  {
    title: 'Add Page Numbers',
    description: 'Insert page numbers into your PDF.',
    icon: Hash,
    path: '/add-page-numbers',
    category: 'Edit PDF',
  },
  {
    title: 'Add Watermark',
    description: 'Stamp your PDF with text or an image.',
    icon: Paintbrush,
    path: '/add-watermark',
    category: 'Edit PDF',
  },
  {
    title: 'Crop PDF',
    description: 'Trim the margins of your PDF pages.',
    icon: Crop,
    path: '/crop-pdf',
    category: 'Edit PDF',
  },
  {
    title: 'Edit PDF',
    description: 'Modify text and images in your PDF.',
    icon: FilePenLine,
    path: '/edit-pdf',
    category: 'Edit PDF',
  },
   {
    title: 'Compare PDF',
    description: 'See what has changed between two PDFs.',
    icon: GitCompareArrows,
    path: '/compare-pdf',
    category: 'Edit PDF',
  },
  // PDF Security
  {
    title: 'Unlock PDF',
    description: 'Remove password and restrictions from a PDF.',
    icon: LockOpen,
    path: '/unlock-pdf',
    category: 'PDF Security',
  },
  {
    title: 'Protect PDF',
    description: 'Add a password to secure your PDF.',
    icon: Lock,
    path: '/protect-pdf',
    category: 'PDF Security',
  },
  {
    title: 'Sign PDF',
    description: 'Apply your digital signature to a document.',
    icon: PenLine,
    path: '/sign-pdf',
    category: 'PDF Security',
  },
  {
    title: 'Redact PDF',
    description: 'Permanently black out sensitive information.',
    icon: EyeOff,
    path: '/redact-pdf',
    category: 'PDF Security',
  },
  // AI Tools
  {
    title: 'Smart Summary',
    description: 'Use AI to get a summary of your document.',
    icon: Sparkles,
    path: '/summarize-pdf',
    category: 'AI Tools',
  },
];
