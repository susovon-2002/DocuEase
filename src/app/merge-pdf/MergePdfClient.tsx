
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Wand2, ArrowLeft, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { renderPdfPagesToImageUrls } from '@/lib/pdf-utils';
import { PageThumbnail } from './PageThumbnail';
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

  const processAndAddFiles = async (filesToAdd: File[]) => {
    if (filesToAdd.length === 0) return;
    
    setIsProcessing(true);
    
    const startingFileIndex = selectedFiles.length;
    let pageIdCounter = pages.length > 0 ? Math.max(...pages.map(p => p.id)) + 1 : 0;
    
    const newPages: PageObject[] = [];
    const validFilesToAdd: File[] = [];

    for (let i = 0; i < filesToAdd.length; i++) {
        const file = filesToAdd[i];
        if (file.type !== 'application/pdf') {
          toast({ variant: 'destructive', title: 'Invalid File Type', description: `${file.name} is not a PDF.`});
          continue;
        }
        
        validFilesToAdd.push(file);
        const fileIndexInSelection = startingFileIndex + validFilesToAdd.length - 1;
        setProcessingMessage(`Processing ${file.name}...`);
        
        try {
            const fileBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
            const imageUrls = await renderPdfPagesToImageUrls(new Uint8Array(fileBuffer));
            
            for (let pageIndex = 0; pageIndex < pdfDoc.getPageCount(); pageIndex++) {
              newPages.push({
                id: pageIdCounter++,
                thumbnailUrl: imageUrls[pageIndex],
                originalFileIndex: fileIndexInSelection,
                originalPageIndex: pageIndex,
                fileName: file.name
              });
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'An error occurred', description: `Could not process ${file.name}. It might be corrupted or encrypted.` });
        }
    }
      
    if (newPages.length > 0) {
      setPages(currentPages => [...currentPages, ...newPages]);
      setSelectedFiles(currentFiles => [...currentFiles, ...validFilesToAdd]);
      
      if (step === 'upload') {
        setStep('reorder');
      }
      toast({ title: `${validFilesToAdd.length} file(s) added`, description: 'You can now reorder the pages.' });
    }

    setIsProcessing(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      processAndAddFiles(files);
    }
    // Reset input to allow selecting same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []);
     if (files.length > 0) {
      processAndAddFiles(files);
    }
  };
  
  const handleRemovePage = (idToRemove: number) => {
    setPages(currentPages => {
        const pageToRemove = currentPages.find(p => p.id === idToRemove);
        if (pageToRemove) {
            URL.revokeObjectURL(pageToRemove.thumbnailUrl);
        }
        const newPages = currentPages.filter(p => p.id !== idToRemove);

        if (newPages.length === 0) {
            handleStartOver();
        }

        return newPages;
    });
  };
  
  const handlePageDragStart = (index: number) => setDraggedPageIndex(index);

  const handlePageDragEnter = (index: number) => {
    if (draggedPageIndex === null || draggedPageIndex === index) return;
    
    setPages(currentPages => {
        const newPages = [...currentPages];
        const draggedItem = newPages.splice(draggedPageIndex, 1)[0];
        newPages.splice(index, 0, draggedItem);
        setDraggedPageIndex(index);
        return newPages;
    });
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
        const sourcePdfCache = new Map<number, PDFDocument>();

        for (const page of pages) {
            let sourcePdf = sourcePdfCache.get(page.originalFileIndex);
            if (!sourcePdf) {
                const sourceFile = selectedFiles[page.originalFileIndex];
                if (!sourceFile) {
                    console.error(`Source file at index ${page.originalFileIndex} not found.`);
                    continue; 
                }
                const sourceBuffer = await sourceFile.arrayBuffer();
                sourcePdf = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });
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
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 rounded-lg border min-h-[200px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
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
                  className="border-2 border-dashed rounded-lg flex items-center justify-center text-center p-4 cursor-pointer hover:bg-accent hover:border-primary transition-colors min-h-[200px]"
                  onClick={handleFileSelectClick}
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Plus className="h-8 w-8" />
                    <span className="text-sm font-medium">Add More Files</span>
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
