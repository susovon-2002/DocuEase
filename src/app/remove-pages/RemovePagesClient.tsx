'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, File as FileIcon, Download, RefreshCw, Trash2, ArrowRight, Search, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { renderPdfPagesToImageUrls } from '@/lib/pdf-utils';
import { PageThumbnail } from '../merge-pdf/PageThumbnail';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';


// Configure the pdf.js worker.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type PageObject = {
  id: number;
  thumbnailUrl: string;
  pageNumber: number;
};

type RemoveStep = 'upload' | 'select' | 'download';

export function RemovePagesClient() {
  const [step, setStep] = useState<RemoveStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [allPages, setAllPages] = useState<PageObject[]>([]);
  
  const [pagesToRemove, setPagesToRemove] = useState<Set<number>>(new Set());
  const [pagesToRemoveInput, setPagesToRemoveInput] = useState('');
  const [textToSearch, setTextToSearch] = useState('');
  
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob } | null>(null);

  const [foundPagesByText, setFoundPagesByText] = useState<number[]>([]);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [pagesToSelectFromSearch, setPagesToSelectFromSearch] = useState<Set<number>>(new Set());


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
      for (let i = 0; i < imageUrls.length; i++) {
        pageObjects.push({ 
          id: Date.now() + i, 
          thumbnailUrl: imageUrls[i],
          pageNumber: i + 1,
        });
      }
      
      setAllPages(pageObjects);
      setStep('select');
      toast({ title: 'PDF Loaded', description: 'Select the pages you want to remove.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not load the PDF.' });
      handleStartOver();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePageSelection = (pageNumber: number) => {
    setPagesToRemove(prev => {
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
    const parts = pagesToRemoveInput.split(/,| /).filter(s => s.trim() !== '');

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

    setPagesToRemove(validPages);
    toast({ title: 'Selection Updated', description: `${validPages.size} pages have been selected for removal.` });
  };
  
  const handleSelectFromText = async () => {
    if (!textToSearch.trim()) {
      toast({ variant: 'destructive', title: 'Empty Search', description: 'Please enter text to search for.' });
      return;
    }
    if (!originalFile) return;

    setIsProcessing(true);
    setProcessingMessage('Searching pages...');

    try {
      const fileBuffer = await originalFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
      const pagesFound: number[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');

        if (pageText.toLowerCase().includes(textToSearch.toLowerCase())) {
          pagesFound.push(i);
        }
      }
      
      if(pagesFound.length > 0) {
        setFoundPagesByText(pagesFound);
        setPagesToSelectFromSearch(new Set());
        setIsReviewDialogOpen(true);
      } else {
        toast({ title: 'No Pages Found', description: `No pages were found containing the specified text.` });
      }

    } catch (error) {
       console.error(error);
       toast({ variant: 'destructive', title: 'Search Failed', description: 'Could not search the PDF for text.' });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleReviewDialogConfirm = () => {
    setPagesToRemove(prev => new Set([...prev, ...pagesToSelectFromSearch]));
    setIsReviewDialogOpen(false);
    toast({
      title: 'Selection Updated',
      description: `${pagesToSelectFromSearch.size} pages were added to the removal list.`
    });
  };

  const togglePageInDialog = (pageNumber: number) => {
    setPagesToSelectFromSearch(prev => {
        const newSet = new Set(prev);
        if (newSet.has(pageNumber)) {
            newSet.delete(pageNumber);
        } else {
            newSet.add(pageNumber);
        }
        return newSet;
    });
  };

  const handleRemove = async () => {
    if (pagesToRemove.size === 0) {
      toast({
        variant: 'destructive',
        title: 'No pages selected',
        description: 'Please select at least one page to remove.',
      });
      return;
    }
     if (pagesToRemove.size === allPages.length) {
      toast({
        variant: 'destructive',
        title: 'Cannot remove all pages',
        description: 'You cannot remove every page from the document.',
      });
      return;
    }

    setIsProcessing(true);
    setProcessingMessage('Removing pages...');

    try {
      const originalPdfDoc = await PDFDocument.load(await originalFile!.arrayBuffer());
      const newPdf = await PDFDocument.create();

      const pageIndicesToKeep = allPages
        .map(p => p.pageNumber - 1)
        .filter(index => !pagesToRemove.has(index + 1));
        
      const copiedPages = await newPdf.copyPages(originalPdfDoc, pageIndicesToKeep);
      copiedPages.forEach(p => newPdf.addPage(p));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      setOutputFile({ name: `${originalFile!.name.replace('.pdf', '')}_modified.pdf`, blob });
      setStep('download');
      toast({ title: 'Pages Removed Successfully!', description: 'Your new document is ready for download.' });

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
    setPagesToRemove(new Set());
    setPagesToRemoveInput('');
    setTextToSearch('');
    setOutputFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleGoBackToSelect = () => {
    setOutputFile(null);
    setStep('select');
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
            <h1 className="text-3xl font-bold">Remove Pages</h1>
            <p className="text-muted-foreground mt-2">Easily delete one or more pages from your PDF file.</p>
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
            <h1 className="text-3xl font-bold">Select Pages to Remove</h1>
            <p className="text-muted-foreground mt-2">Click on pages to select them for removal, or use the input fields below.</p>
          </div>

          <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Review Found Pages</DialogTitle>
                    <p className="text-sm text-muted-foreground">Select the pages you want to add to the removal list.</p>
                </DialogHeader>
                <ScrollArea className="h-72 w-full rounded-md border p-4">
                    <div className="space-y-2">
                        {foundPagesByText.map(pageNumber => (
                            <div key={pageNumber} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`check-page-${pageNumber}`}
                                    checked={pagesToSelectFromSearch.has(pageNumber)}
                                    onCheckedChange={() => togglePageInDialog(pageNumber)}
                                />
                                <Label htmlFor={`check-page-${pageNumber}`}>Page {pageNumber}</Label>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleReviewDialogConfirm}>Add to Selection</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
          
           <Card className="mb-6">
            <CardHeader>
                <CardTitle className="text-lg">Smart Selection Tools</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid md:grid-cols-2 gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                    <label htmlFor="pageNumbers" className="font-medium flex-shrink-0 text-sm">Pages to remove:</label>
                    <Input 
                        id="pageNumbers"
                        placeholder="e.g., 1, 5, 8-12"
                        value={pagesToRemoveInput}
                        onChange={(e) => setPagesToRemoveInput(e.target.value)}
                        className="flex-grow"
                    />
                    <Button onClick={handleSelectFromInput} variant="secondary">
                        Select by Number <ArrowRight className="ml-2 h-4 w-4"/>
                    </Button>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                     <label htmlFor="pageText" className="font-medium flex-shrink-0 text-sm">Find pages with text:</label>
                    <Input 
                        id="pageText"
                        placeholder="e.g., Appendix"
                        value={textToSearch}
                        onChange={(e) => setTextToSearch(e.target.value)}
                        className="flex-grow"
                    />
                    <Button onClick={handleSelectFromText} variant="secondary">
                        Find Pages <Search className="ml-2 h-4 w-4"/>
                    </Button>
                </div>
            </CardContent>
           </Card>

           <div className="flex justify-center gap-4 mt-8 mb-8">
              <Button onClick={handleStartOver} variant="outline">Back</Button>
              <Button onClick={handleRemove} size="lg" disabled={pagesToRemove.size === 0}>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Pages ({pagesToRemove.size})
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
                            pagesToRemove.has(page.pageNumber) && "border-red-500 opacity-50"
                          )}
                        >
                          <PageThumbnail thumbnailUrl={page.thumbnailUrl} pageNumber={page.pageNumber} />
                        </div>
                        <div className={cn(
                          "absolute top-2 left-2 w-6 h-6 bg-white rounded-full flex items-center justify-center border transition-opacity",
                          pagesToRemove.has(page.pageNumber) ? "opacity-100" : "opacity-0"
                        )}>
                            <Trash2 className="w-4 h-4 text-red-500"/>
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
                    <p className="text-muted-foreground mt-2">Your modified document is ready. Download it below.</p>
                </div>
                <div className="flex justify-center gap-4">
                    <Button onClick={handleGoBackToSelect} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
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
