'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Wand2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

// Configure the pdf.js worker.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type OptimizeStep = 'upload' | 'download';

export function OptimizePdfClient() {
  const [step, setStep] = useState<OptimizeStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob, originalSize: number, newSize: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelectClick = () => fileInputRef.current?.click();

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      handleOptimize(file);
    } else if (file) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only PDF files are supported.',
      });
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      handleOptimize(file);
    } else if (file) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only PDF files are supported for dropping.',
      });
    }
  };
  
  const handleOptimize = async (file: File) => {
    setOriginalFile(file);
    setIsProcessing(true);
    setProcessingMessage('Optimizing PDF...');

    try {
        const fileBuffer = await file.arrayBuffer();
        const sourcePdfDoc = await PDFDocument.load(fileBuffer);
        const newPdfDoc = await PDFDocument.create();

        // This process of copying pages helps remove unused objects and metadata.
        const pageIndices = sourcePdfDoc.getPageIndices();
        const copiedPages = await newPdfDoc.copyPages(sourcePdfDoc, pageIndices);
        copiedPages.forEach(page => newPdfDoc.addPage(page));

        // Re-saving the doc can help clean it up.
        // For web optimization (linearization), saving with useObjectStreams: false is a good first step.
        const pdfBytes = await newPdfDoc.save({ useObjectStreams: false });
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        const originalSize = file.size;
        const newSize = blob.size;

        setOutputFile({ name: `${file.name.replace('.pdf', '')}_optimized.pdf`, blob, originalSize, newSize });
        setStep('download');
        toast({ title: 'Optimization Complete!', description: 'Your PDF has been optimized for web view.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not optimize the PDF.' });
      handleStartOver();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setStep('upload');
    setOriginalFile(null);
    setOutputFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
  
  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">{processingMessage}</p>
        <p className="text-muted-foreground">Please wait a moment...</p>
      </div>
    );
  }

  switch (step) {
    case 'upload':
      return (
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Optimize PDF</h1>
            <p className="text-muted-foreground mt-2">Optimize your PDF for fast web viewing, ensuring a smooth experience for your readers.</p>
          </div>
          <Card className="border-2 border-dashed" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
            <CardContent className="p-10 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="bg-secondary p-4 rounded-full">
                  <UploadCloud className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">Drag & drop a PDF file here</p>
                <p className="text-muted-foreground">or</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="application/pdf"
                />
                <Button size="lg" onClick={handleFileSelectClick}>Select File</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    
    case 'download':
        const { originalSize, newSize } = outputFile || { originalSize: 0, newSize: 0 };
        const savings = originalSize > 0 ? Math.round(((originalSize - newSize) / originalSize) * 100) : 0;
        return (
            <div className="w-full max-w-xl mx-auto text-center">
                 <div className="mb-8">
                    <h1 className="text-3xl font-bold">Optimization Complete!</h1>
                    <p className="text-muted-foreground mt-2">Your PDF is now optimized for the web.</p>
                </div>
                <Card className="mb-8">
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                        <div className="py-4 px-2">
                           <p className="text-sm text-muted-foreground">Original Size</p>
                           <p className="text-2xl font-bold">{formatBytes(originalSize)}</p>
                        </div>
                        <div className="py-4 px-2">
                            <p className="text-sm text-muted-foreground">New Size</p>
                            <p className="text-2xl font-bold">{formatBytes(newSize)}</p>
                        </div>
                        <div className="py-4 px-2">
                            <p className="text-sm text-muted-foreground">You saved</p>
                            <p className="text-2xl font-bold text-green-600">{savings}%</p>
                        </div>
                    </CardContent>
                </Card>
                <div className="flex justify-center gap-4">
                    <Button onClick={handleStartOver} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Optimize Another
                    </Button>
                    <Button onClick={handleDownloadFile} size="lg">
                        <Download className="mr-2 h-4 w-4" />
                        Download Optimized PDF
                    </Button>
                </div>
            </div>
        )
  }
}
