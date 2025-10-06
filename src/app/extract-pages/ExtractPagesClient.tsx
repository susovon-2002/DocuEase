'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Copy, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { renderPdfPagesToImageUrls } from '@/lib/pdf-utils';
import { PageThumbnail } from '../merge-pdf/PageThumbnail';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

type PageObject = {
  id: number;
  thumbnailUrl: string;
  pageNumber: number;
};

type ExtractStep = 'upload' | 'select' | 'download';

export function ExtractPagesClient() {
  const [step, setStep] = useState<ExtractStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [allPages, setAllPages] = useState<PageObject[]>([]);
  
  const [pagesToExtract, setPagesToExtract] = useState<Set<number>>(new Set());
  const [pagesToExtractInput, setPagesToExtractInput] = useState('');
  
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelectClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setOriginalFile(file);
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
      setOriginalFile(file);
    } else if (file) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only PDF files are supported for dropping.',
      });
    }
  };

  useEffect(() => {
    if (originalFile) {
      processOriginalFile();
    }
  }, [originalFile]);

  const processOriginalFile = async () => {
    if (!originalFile) return;

    setIsProcessing(true);
    setProcessingMessage('Reading PDF...');
    
    try {
      const fileBuffer = await originalFile.arrayBuffer();
      
      setProcessingMessage('Generating thumbnails...');
      const imageUrls = await renderPdfPagesToImageUrls(new Uint8Array(fileBuffer));

      const pageObjects: PageObject[] = [];
      const pdfDoc = await PDFDocument.load(fileBuffer);
      for (let i = 0; i < pdfDoc.getPageCount(); i++) {
        pageObjects.push({ 
          id: Date.now() + i, 
          thumbnailUrl: imageUrls[i],
          pageNumber: i + 1,
        });
      }
      
      setAllPages(pageObjects);
      setStep('select');
      toast({ title: 'PDF Loaded', description: 'Select the pages you want to extract.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not load the PDF.' });
      handleStartOver();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePageSelection = (pageNumber: number) => {
    setPagesToExtract(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageNumber)) {
        newSet.delete(pageNumber);
      } else {
        newSet.add(pageNumber);
      }
      return newSet;
    });
  };

  const handleSelectFromInput = () => {
    const pageNumbers = new Set<number>();
    const parts = pagesToExtractInput.split(/,| /).filter(s => s.trim() !== '');

    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            pageNumbers.add(i);
          }
        } else {
          toast({ variant: 'destructive', title: 'Invalid Range', description: `The range "${part}" is not valid.` });
          return;
        }
      } else {
        const num = parseInt(part, 10);
        if (!isNaN(num)) {
          pageNumbers.add(num);
        } else {
          toast({ variant: 'destructive', title: 'Invalid Number', description: `The value "${part}" is not a valid page number.` });
          return;
        }
      }
    }
    
    const validPages = new Set<number>();
    const invalidPages: number[] = [];

    for (const num of Array.from(pageNumbers)) {
      if (num > 0 && num <= allPages.length) {
        validPages.add(num);
      } else {
        invalidPages.push(num);
      }
    }

    if (invalidPages.length > 0) {
      toast({ variant: 'destructive', title: 'Invalid Page Numbers', description: `These pages are out of range: ${invalidPages.join(', ')}.` });
    }

    setPagesToExtract(validPages);
    toast({ title: 'Selection Updated', description: `${validPages.size} pages have been selected for extraction.` });
  };

  const handleExtract = async () => {
    if (pagesToExtract.size === 0) {
      toast({
        variant: 'destructive',
        title: 'No pages selected',
        description: 'Please select at least one page to extract.',
      });
      return;
    }

    setIsProcessing(true);
    setProcessingMessage('Extracting pages...');

    try {
      const originalPdfDoc = await PDFDocument.load(await originalFile!.arrayBuffer());
      const newPdf = await PDFDocument.create();

      const pageIndicesToKeep = Array.from(pagesToExtract).sort((a,b) => a-b).map(n => n-1);
        
      const copiedPages = await newPdf.copyPages(originalPdfDoc, pageIndicesToKeep);
      copiedPages.forEach(p => newPdf.addPage(p));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      setOutputFile({ name: `${originalFile!.name.replace('.pdf', '')}_extracted.pdf`, blob });
      setStep('download');
      toast({ title: 'Pages Extracted Successfully!', description: 'Your new document is ready for download.' });

    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Processing Failed', description: error.message || 'An unexpected error occurred.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setStep('upload');
    setOriginalFile(null);
    allPages.forEach(p => URL.revokeObjectURL(p.thumbnailUrl));
    setAllPages([]);
    setPagesToExtract(new Set());
    setPagesToExtractInput('');
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
            <h1 className="text-3xl font-bold">Extract Pages</h1>
            <p className="text-muted-foreground mt-2">Select and extract specific pages from a PDF to create a new, smaller document.</p>
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
                <p className="text-xs text-muted-foreground mt-4">Only one PDF file is supported.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    
    case 'select':
      return (
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Select Pages to Extract</h1>
            <p className="text-muted-foreground mt-2">Click on pages to select them for extraction, or use the input below.</p>
          </div>
          
           <Card className="mb-6">
            <CardHeader>
                <CardTitle className="text-lg">Selection Tools</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
                <label htmlFor="pageNumbers" className="font-medium flex-shrink-0">Pages to extract:</label>
                <Input 
                    id="pageNumbers"
                    placeholder="e.g., 1, 5, 8-12"
                    value={pagesToExtractInput}
                    onChange={(e) => setPagesToExtractInput(e.target.value)}
                    className="flex-grow"
                />
                <Button onClick={handleSelectFromInput} variant="secondary">
                    Select by Number
                </Button>
            </CardContent>
           </Card>

           <div className="flex justify-center gap-4 mt-8 mb-8">
              <Button onClick={handleStartOver} variant="outline">Back</Button>
              <Button onClick={handleExtract} size="lg" disabled={pagesToExtract.size === 0}>
                <Copy className="mr-2 h-4 w-4" />
                Extract Pages ({pagesToExtract.size})
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 p-4 rounded-lg border max-h-[60vh] overflow-y-auto">
                    {allPages.map(page => (
                      <div
                        key={page.id}
                        className="relative"
                        onClick={() => handleTogglePageSelection(page.pageNumber)}
                      >
                         <div
                          className={cn(
                            "rounded-md shadow-md cursor-pointer transition-all border-2 border-transparent",
                            pagesToExtract.has(page.pageNumber) && "border-primary ring-2 ring-primary"
                          )}
                        >
                          <PageThumbnail thumbnailUrl={page.thumbnailUrl} pageNumber={page.pageNumber} />
                        </div>
                        <div className={cn(
                          "absolute top-2 left-2 w-6 h-6 bg-white rounded-full flex items-center justify-center border transition-opacity",
                          pagesToExtract.has(page.pageNumber) ? "opacity-100" : "opacity-0"
                        )}>
                            <CheckSquare className="w-4 h-4 text-primary"/>
                        </div>
                      </div>
                    ))}
                  </div>
              </CardContent>
            </Card>
        </div>
      );

    case 'download':
        return (
            <div className="w-full max-w-4xl mx-auto text-center">
                 <div className="mb-8">
                    <h1 className="text-3xl font-bold">Process Complete!</h1>
                    <p className="text-muted-foreground mt-2">Your new document is ready. Download it below.</p>
                </div>
                <div className="flex justify-center gap-4">
                    <Button onClick={handleStartOver} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Start Over
                    </Button>
                    <Button onClick={handleDownloadFile} size="lg">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                </div>
                <Card className="mt-8">
                    <CardContent className="p-2">
                        <iframe src={URL.createObjectURL(outputFile!.blob)} className="w-full h-[70vh] border-0" title="Final PDF Preview" />
                    </CardContent>
                </Card>
            </div>
        )
  }
}
