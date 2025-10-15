'use client';

import { useState, useRef, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, File as FileIcon, X, Download, RefreshCw, Wand2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { renderPdfPagesToImageUrls } from '@/lib/pdf-utils';
import { PageThumbnail } from './PageThumbnail';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type PageObject = {
  id: number;
  thumbnailUrl: string;
  originalFileIndex: number;
  originalPageIndex: number;
  fileName: string;
};

type MergeStep = 'upload' | 'reorder' | 'download';

export function MergePdfClient() {
  const [step, setStep] = useState<MergeStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<PageObject[]>([]);
  
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const handleFileSelectClick = () => fileInputRef.current?.click();

  const handleFilesSelected = async (files: File[]) => {
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== files.length) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only PDF files are supported.',
      });
    }

    if (pdfFiles.length === 0) return;

    const newFiles = [...selectedFiles, ...pdfFiles];
    setSelectedFiles(newFiles);
    await processFiles(newFiles);
  };
  
  const processFiles = async (filesToProcess: File[]) => {
    if (filesToProcess.length === 0) {
      setPages([]);
      setStep('upload');
      return;
    }
    
    setIsProcessing(true);
    setProcessingMessage('Processing files...');
    setStep('reorder');

    try {
      const allPageObjects: PageObject[] = [];
      let pageIdCounter = 0;

      for (let fileIndex = 0; fileIndex < filesToProcess.length; fileIndex++) {
        const file = filesToProcess[fileIndex];
        setProcessingMessage(`Reading ${file.name}...`);
        
        // Skip reprocessing files that are already in the pages state
        if (pages.some(p => p.originalFileIndex === fileIndex)) continue;

        const fileBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBuffer);
        const imageUrls = await renderPdfPagesToImageUrls(new Uint8Array(fileBuffer));
        
        for (let pageIndex = 0; pageIndex < pdfDoc.getPageCount(); pageIndex++) {
          allPageObjects.push({
            id: Date.now() + pageIdCounter++,
            thumbnailUrl: imageUrls[pageIndex],
            originalFileIndex: fileIndex,
            originalPageIndex: pageIndex,
            fileName: file.name
          });
        }
      }
      
      setPages(currentPages => [...currentPages, ...allPageObjects]);
      toast({ title: 'Files Ready', description: 'Drag and drop pages to reorder them.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not process the PDF files.' });
      handleStartOver(); // Reset if something fails
    } finally {
      setIsProcessing(false);
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesSelected(Array.from(event.target.files || []));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFilesSelected(Array.from(event.dataTransfer.files || []));
  };
  
  const handleRemovePage = (idToRemove: number) => {
    const pageToRemove = pages.find(p => p.id === idToRemove);
    if (!pageToRemove) return;

    // Revoke the object URL to free memory
    URL.revokeObjectURL(pageToRemove.thumbnailUrl);
    
    const newPages = pages.filter(p => p.id !== idToRemove);
    setPages(newPages);

    if (newPages.length === 0) {
      handleStartOver();
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
  
  const handleFinalize = async () => {
      if (pages.length === 0) {
        toast({ variant: 'destructive', title: 'No pages', description: 'There are no pages to merge.' });
        return;
      }
      setIsProcessing(true);
      setProcessingMessage('Creating final PDF...');

      try {
        const finalPdf = await PDFDocument.create();

        // Create a map to load each source PDF only once
        const sourcePdfCache = new Map<number, PDFDocument>();

        for (const page of pages) {
            let sourcePdf = sourcePdfCache.get(page.originalFileIndex);
            if (!sourcePdf) {
                const sourceFile = selectedFiles[page.originalFileIndex];
                if (!sourceFile) {
                    console.error(`Source file at index ${page.originalFileIndex} not found.`);
                    continue; // or throw an error
                }
                const sourceBuffer = await sourceFile.arrayBuffer();
                sourcePdf = await PDFDocument.load(sourceBuffer);
                sourcePdfCache.set(page.originalFileIndex, sourcePdf);
            }
            
            const [copiedPage] = await finalPdf.copyPages(sourcePdf, [page.originalPageIndex]);
            finalPdf.addPage(copiedPage);
        }

        const pdfBytes = await finalPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        setOutputFile({ name: 'merged_document.pdf', blob });
        setStep('download');
        toast({ title: 'Merge Complete!', description: 'Your merged PDF is ready.'});

      } catch (error) {
         console.error(error);
         toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not create the final PDF.' });
      } finally {
        setIsProcessing(false);
      }
  };


  const handleStartOver = () => {
    setStep('upload');
    setSelectedFiles([]);
    pages.forEach(p => URL.revokeObjectURL(p.thumbnailUrl));
    setPages([]);
    setOutputFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleGoBackToReorder = () => {
    setOutputFile(null);
    setStep('reorder');
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
            <h1 className="text-3xl font-bold">Merge PDF</h1>
            <p className="text-muted-foreground mt-2">Combine multiple PDFs into a single, organized document.</p>
          </div>
          <Card className="border-2 border-dashed" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
            <CardContent className="p-10 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="bg-secondary p-4 rounded-full">
                  <UploadCloud className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">Drag & drop PDF files here</p>
                <p className="text-muted-foreground">or</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="application/pdf"
                  multiple
                />
                <Button size="lg" onClick={handleFileSelectClick}>Select Files</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    
    case 'reorder':
      return (
        <div className="w-full max-w-6xl mx-auto">
           <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Organize Your Pages</h1>
            <p className="text-muted-foreground mt-2">Drag and drop the pages to reorder them as you like. You can also add more files.</p>
          </div>
          <Card>
            <CardContent className="p-6">
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFilesSelected(Array.from(e.dataTransfer.files || []));
                }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 rounded-lg border min-h-[200px]"
              >
                {pages.map((page, index) => (
                  <div
                    key={page.id}
                    className={cn("relative group transition-opacity", draggedPageIndex === index && "opacity-50")}
                    draggable
                    onDragStart={() => handlePageDragStart(index)}
                    onDragEnter={() => handlePageDragEnter(index)}
                    onDragEnd={handlePageDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <PageThumbnail
                      thumbnailUrl={page.thumbnailUrl}
                      pageNumber={index + 1}
                      fileName={page.fileName}
                    />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onClick={() => handleRemovePage(page.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                 <div 
                    className="flex items-center justify-center border-2 border-dashed rounded-md cursor-pointer hover:bg-accent hover:border-primary transition-colors"
                    onClick={handleFileSelectClick}
                  >
                    <div className="text-center text-muted-foreground p-4">
                      <UploadCloud className="mx-auto h-8 w-8 mb-2" />
                      <p className="text-sm">Add More Files</p>
                    </div>
                 </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-center gap-4 mt-8">
            <Button onClick={handleStartOver} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Start Over
            </Button>
            <Button onClick={handleFinalize} size="lg" disabled={pages.length === 0}>
                <Wand2 className="mr-2 h-4 w-4" /> Merge PDF
            </Button>
          </div>
        </div>
      );

    case 'download':
        return (
            <div className="w-full max-w-4xl mx-auto text-center">
                 <div className="mb-8">
                    <h1 className="text-3xl font-bold">Merge Complete!</h1>
                    <p className="text-muted-foreground mt-2">Your merged PDF is ready. Download it below.</p>
                </div>
                <div className="flex justify-center gap-4">
                    <Button onClick={handleGoBackToReorder} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Reorder
                    </Button>
                    <Button onClick={handleDownloadFile} size="lg">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                </div>
                 <div className="flex justify-center mt-4">
                    <Button onClick={handleStartOver} variant="link">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Merge More Files
                    </Button>
                </div>
                <Card className="mt-8">
                    <CardContent className="p-2">
                       {outputFile && <iframe src={URL.createObjectURL(outputFile.blob)} className="w-full h-[70vh] border-0" title="Final PDF Preview" />}
                    </CardContent>
                </Card>
            </div>
        )
  }
}
