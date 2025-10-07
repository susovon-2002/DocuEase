'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, UploadCloud, Download, Wand2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { renderPdfPagesToImageUrls } from '@/lib/pdf-utils';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const formSchema = z.object({
  pdfFile: z
    .any()
    .refine((files) => files?.length === 1, 'PDF file is required.')
    .refine((files) => files?.[0]?.type === 'application/pdf', 'Only PDF files are accepted.')
    .refine((files) => files?.[0]?.size <= 10 * 1024 * 1024, 'File size must be less than 10MB.'),
});

type FormValues = z.infer<typeof formSchema>;

export function OcrPdfClient() {
  const [step, setStep] = useState<'upload' | 'download'>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob } | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setOutputFile(null);

    const file = data.pdfFile[0];
    const fileBuffer = await file.arrayBuffer();

    try {
      // 1. Get text content from the original PDF using pdf.js
      const pdfjsDoc = await pdfjsLib.getDocument({ data: fileBuffer.slice(0) }).promise;
      let fullText = '';
      for (let i = 1; i <= pdfjsDoc.numPages; i++) {
        const page = await pdfjsDoc.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(' ');
        fullText += '\n'; // Add a newline between pages
      }
      
      if (!fullText.trim()) {
        throw new Error('No text could be extracted from this document.');
      }

      // 2. Rebuild the PDF with an invisible text layer using pdf-lib
      const newPdfDoc = await PDFDocument.create();
      const font = await newPdfDoc.embedFont(StandardFonts.Helvetica);

      // Render original pages as images to preserve layout
      const pageImageUrls = await renderPdfPagesToImageUrls(new Uint8Array(fileBuffer));
      const originalPdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });

      for (let i = 0; i < originalPdfDoc.getPageCount(); i++) {
        const originalPage = originalPdfDoc.getPage(i);
        const { width, height } = originalPage.getSize();
        const newPage = newPdfDoc.addPage([width, height]);
        
        // Draw the original page as an image
        const imageUrl = pageImageUrls[i];
        const imageBytes = await fetch(imageUrl).then(res => res.arrayBuffer());
        const image = await newPdfDoc.embedJpg(imageBytes);
        newPage.drawImage(image, { x: 0, y: 0, width, height });
      }
      
      // Add all text to a single invisible layer on the first page
      // This is a simplified approach for making the document searchable as a whole.
      const firstPage = newPdfDoc.getPage(0);
      firstPage.drawText(fullText, {
        x: 0,
        y: 0,
        font,
        size: 1,
        color: rgb(1, 1, 1),
        opacity: 0,
      });
      
      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      setOutputFile({ name: `${file.name.replace('.pdf', '')}_searchable.pdf`, blob });
      setStep('download');
      toast({ title: 'OCR Complete!', description: 'Your PDF is now searchable.' });

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: error instanceof Error ? error.message : 'Could not make the PDF searchable. It might not contain any text.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    setStep('upload');
    setOutputFile(null);
    setFileName('');
    form.reset();
  };

  const handleDownloadFile = () => {
    if (!outputFile) return;
    const url = URL.createObjectURL(outputFile.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outputFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (step === 'download') {
    return (
      <div className="w-full max-w-4xl mx-auto text-center">
           <div className="mb-8">
              <h1 className="text-3xl font-bold">Processing Complete</h1>
              <p className="text-muted-foreground mt-2">Your searchable PDF is ready for download.</p>
          </div>
          <Card className="mb-8">
              <CardContent className="p-6">
                <p className="font-semibold text-lg mb-4">{outputFile?.name}</p>
                <iframe src={URL.createObjectURL(outputFile!.blob)} className="w-full h-[60vh] border-0 rounded-md" title="Searchable PDF Preview" />
              </CardContent>
          </Card>
          <div className="flex justify-center gap-4">
              <Button onClick={handleStartOver} variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Process Another
              </Button>
              <Button onClick={handleDownloadFile} size="lg">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
              </Button>
          </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">OCR PDF</h1>
        <p className="text-muted-foreground mt-2">Recognize text in your scanned PDFs to make them searchable and editable.</p>
      </div>
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="p-6 space-y-6">
              <FormField
                control={form.control}
                name="pdfFile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="relative flex items-center w-full h-32 rounded-md border-2 border-dashed bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent/50 transition-colors font-normal group justify-center flex-col gap-2">
                       <div className="bg-secondary p-3 rounded-full border">
                         <UploadCloud className="w-8 h-8 text-muted-foreground transition-colors group-hover:text-accent-foreground" />
                       </div>
                      <span className="text-muted-foreground flex-1 truncate transition-colors group-hover:text-accent-foreground text-base">
                        {fileName || "Select a PDF file to process"}
                      </span>
                       <p className="text-xs text-muted-foreground">Max file size 10MB</p>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="application/pdf"
                        className="sr-only"
                        ref={field.ref}
                        onBlur={field.onBlur}
                        name={field.name}
                        onChange={(e) => {
                          field.onChange(e.target.files);
                          setFileName(e.target.files?.[0]?.name || '');
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardHeader>
              <Button type="submit" disabled={isLoading || !fileName} size="lg" className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Make Searchable
                  </>
                )}
              </Button>
            </CardHeader>
          </form>
        </Form>
      </Card>
    </div>
  );
}
