'use client';

import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export function MergePdfClient() {
  const [isMerging, setIsMerging] = useState(false);
  const { toast } = useToast();

  const handleMerge = async (files: File[]) => {
    if (files.length < 2) {
      toast({
        variant: 'destructive',
        title: 'Not enough files',
        description: 'Please select at least two PDF files to merge.',
      });
      return;
    }

    setIsMerging(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const fileBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      const mergedPdfBytes = await mergedPdf.save();

      // Trigger download
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Merge Successful',
        description: 'Your PDF has been merged and downloaded.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description:
          error instanceof Error ? error.message : 'Could not merge the PDFs. Please try again.',
      });
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <FileUploadPlaceholder
      title="Merge PDF"
      description="Combine multiple PDF documents into one. Rearrange and organize files as you like."
      onUpload={handleMerge}
      uploadButton={
        <Button size="lg" disabled={isMerging}>
          {isMerging ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Merging...
            </>
          ) : (
            'Merge PDF'
          )}
        </Button>
      }
    />
  );
}
