'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument, PDFImage } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Replace, Plus, GripVertical, FileImage, Wand2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { renderPdfPagesToImageUrls } from '@/lib/pdf-utils';
import { PageThumbnail } from '../merge-pdf/PageThumbnail';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

type PageObject = {
  id: number;
  thumbnailUrl: string;
  pdfBytes: Uint8Array;
  pageNumber: number;
};

type RepairStep = 'upload' | 'edit' | 'download';

export function RepairPdfClient() {
  const [step, setStep] = useState<RepairStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageObject[]>([]);
  
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob } | null>(null);

  const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null);
  const [isReplaceDialogOpen, setIsReplaceDialogOpen] = useState(false);
  const [pageToReplaceIndex, setPageToReplaceIndex] = useState<number | null>(null);
  const replacementFileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

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
      const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
      
      setProcessingMessage('Generating thumbnails...');
      const imageUrls = await renderPdfPagesToImageUrls(new Uint8Array(fileBuffer));

      const pageObjects: PageObject[] = [];
      for (let i = 0; i < pdfDoc.getPageCount(); i++) {
         const singlePagePdf = await PDFDocument.create();
         const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [i]);
         singlePagePdf.addPage(copiedPage);
         const pdfBytes = await singlePagePdf.save();
        pageObjects.push({ 
          id: Date.now() + i, 
          thumbnailUrl: imageUrls[i],
          pageNumber: i + 1,
          pdfBytes
        });
      }
      
      setPages(pageObjects);
      setStep('edit');
      toast({ title: 'PDF Loaded', description: 'Review your pages and replace any that are broken.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not load the PDF. It may be too corrupted.' });
      handleStartOver();
    } finally {
      setIsProcessing(false);
    }
  };

  const openReplaceDialog = (index: number) => {
    setPageToReplaceIndex(index);
    setIsReplaceDialogOpen(true);
  };
  
  const handleReplacementFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || pageToReplaceIndex === null) return;
    
    setIsReplaceDialogOpen(false);
    setIsProcessing(true);
    setProcessingMessage('Replacing page...');

    try {
      const newPageObject = await fileToPageObject(file, pages.length + 1);

      setPages(currentPages => {
        const newPages = [...currentPages];
        newPages[pageToReplaceIndex] = { ...newPageObject, id: newPages[pageToReplaceIndex].id, pageNumber: pageToReplaceIndex + 1 };
        return newPages;
      });

      toast({ title: "Page Replaced", description: `Page ${pageToReplaceIndex + 1} has been updated.` });
    } catch(e) {
      console.error(e);
      toast({ variant: "destructive", title: "Replacement Failed", description: "Could not process the replacement file." });
    } finally {
      setIsProcessing(false);
      setPageToReplaceIndex(null);
    }
  };
  
  const handleAddFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);
      setProcessingMessage('Adding page...');

      try {
          const newPageObject = await fileToPageObject(file, pages.length + 1);
          setPages(currentPages => [...currentPages, newPageObject]);
          toast({ title: 'Page Added', description: 'The new page has been added to the end.' });
      } catch (e) {
          console.error(e);
          toast({ variant: 'destructive', title: 'Failed to Add Page', description: 'Could not process the file to add.' });
      } finally {
          setIsProcessing(false);
      }
  };
  
  const fileToPageObject = async (file: File, newId: number): Promise<PageObject> => {
      let pdfBytes: Uint8Array;
      
      if (file.type.startsWith('image/')) {
        const newPdf = await PDFDocument.create();
        const imageBytes = await file.arrayBuffer();
        let image: PDFImage;
        if(file.type === 'image/png') {
            image = await newPdf.embedPng(imageBytes);
        } else {
            image = await newPdf.embedJpg(imageBytes);
        }
        const page = newPdf.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        pdfBytes = await newPdf.save();
      } else if (file.type === 'application/pdf') {
        const fileBuffer = await file.arrayBuffer();
        const loadedPdf = await PDFDocument.load(fileBuffer);
        if (loadedPdf.getPageCount() !== 1) {
            throw new Error("Replacement PDF must have only one page.");
        }
        pdfBytes = await loadedPdf.save();
      } else {
        throw new Error("Unsupported file type for replacement. Use an image or single-page PDF.");
      }

      const [thumbnailUrl] = await renderPdfPagesToImageUrls(pdfBytes);
      
      return { id: Date.now(), pdfBytes, thumbnailUrl, pageNumber: newId };
  };

  const handleFinalize = async () => {
    if (pages.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No pages available',
        description: 'There are no pages to create a PDF from.',
      });
      return;
    }

    setIsProcessing(true);
    setProcessingMessage('Building new PDF...');

    try {
      const finalPdf = await PDFDocument.create();
      for (const pageObject of pages) {
        const pagePdf = await PDFDocument.load(pageObject.pdfBytes);
        const [copiedPage] = await finalPdf.copyPages(pagePdf, [0]);
        finalPdf.addPage(copiedPage);
      }

      const pdfBytes = await finalPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      setOutputFile({ name: `${originalFile!.name.replace('.pdf', '')}_repaired.pdf`, blob });
      setStep('download');
      toast({ title: 'Repair Complete!', description: 'Your new document is ready for download.' });

    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Processing Failed', description: error.message || 'An unexpected error occurred.' });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handlePageDragStart = (index: number) => setDraggedPageIndex(index);
  const handlePageDragEnter = (index: number) => {
    if (draggedPageIndex === null || draggedPageIndex === index) return;
    const newPages = [...pages];
    const draggedItem = newPages.splice(draggedPageIndex, 1)[0];
    newPages.splice(index, 0, draggedItem);
    setPages(newPages);
    setDraggedPageIndex(index);
  };
  const handlePageDragEnd = () => setDraggedPageIndex(null);


  const handleStartOver = () => {
    setStep('upload');
    setOriginalFile(null);
    pages.forEach(p => URL.revokeObjectURL(p.thumbnailUrl));
    setPages([]);
    setOutputFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleGoBackToEdit = () => {
    setOutputFile(null);
    setStep('edit');
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
            <h1 className="text-3xl font-bold">Repair PDF</h1>
            <p className="text-muted-foreground mt-2">Visually inspect your PDF pages and replace any that are broken or blurry.</p>
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
    
    case 'edit':
      return (
        <div className="w-full max-w-6xl mx-auto">
          <Dialog open={isReplaceDialogOpen} onOpenChange={setIsReplaceDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Replace Page {pageToReplaceIndex !== null ? pageToReplaceIndex + 1 : ''}</DialogTitle>
                <DialogDescription>
                  Upload a new image or a single-page PDF to replace the current page.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <input
                    type="file"
                    ref={replacementFileInputRef}
                    onChange={handleReplacementFileSelected}
                    className="hidden"
                    accept="image/jpeg,image/png,application/pdf"
                  />
                  <Button onClick={() => replacementFileInputRef.current?.click()} className="w-full">
                    <FileImage className="mr-2 h-4 w-4" />
                    Choose replacement file...
                  </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Review and Repair Pages</h1>
            <p className="text-muted-foreground mt-2">Drag to reorder pages. Use the buttons to replace or add pages.</p>
          </div>
          
           <div className="flex justify-center gap-4 mt-8 mb-8">
              <Button onClick={handleStartOver} variant="outline">Start Over</Button>
              <input
                type="file"
                ref={addFileInputRef}
                onChange={handleAddFileSelected}
                className="hidden"
                accept="image/jpeg,image/png,application/pdf"
              />
              <Button onClick={() => addFileInputRef.current?.click()} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Page
              </Button>
              <Button onClick={handleFinalize} size="lg">
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Repaired PDF
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                 <div 
                    onDragOver={e => e.preventDefault()}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4 rounded-lg border min-h-[200px]"
                >
                    {pages.map((page, index) => (
                      <div
                        key={page.id}
                        className={cn("relative group/page transition-opacity", draggedPageIndex === index && "opacity-50")}
                        draggable
                        onDragStart={() => handlePageDragStart(index)}
                        onDragEnter={() => handlePageDragEnter(index)}
                        onDragEnd={handlePageDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                      >
                         <div
                          className="rounded-md shadow-md cursor-grab"
                        >
                          <PageThumbnail thumbnailUrl={page.thumbnailUrl} pageNumber={index + 1} />
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/page:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 gap-2">
                           <Button onClick={() => openReplaceDialog(index)} variant="secondary" className="w-full">
                             <Replace className="mr-2 h-4 w-4"/> Replace
                           </Button>
                           <GripVertical className="h-6 w-6 text-white cursor-grab" />
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
                    <h1 className="text-3xl font-bold">Repair Complete!</h1>
                    <p className="text-muted-foreground mt-2">Your new document is ready. Download it below.</p>
                </div>
                <div className="flex justify-center gap-4">
                     <Button onClick={handleGoBackToEdit} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Editor
                    </Button>
                    <Button onClick={handleDownloadFile} size="lg">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                </div>
                 <div className="flex justify-center mt-4">
                     <Button onClick={handleStartOver} variant="link">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Repair Another File
                    </Button>
                </div>
                <Card className="mt-8">
                    <CardContent className="p-2">
                        <iframe src={URL.createObjectURL(outputFile!.blob)} className="w-full h-[70vh] border-0" title="Repaired PDF Preview" />
                    </CardContent>
                </Card>
            </div>
        )
  }
}
