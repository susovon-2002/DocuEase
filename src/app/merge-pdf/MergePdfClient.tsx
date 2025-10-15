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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== files.length) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only PDF files are supported.',
      });
    }

    setSelectedFiles(prev => [...prev, ...pdfFiles]);
    
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');

    if (pdfFiles.length !== files.length) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only PDF files are supported for dropping.',
      });
    }
    
    setSelectedFiles(prev => [...prev, ...pdfFiles]);
  };
  
  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const handleStartMerge = async () => {
    if (selectedFiles.length < 2) {
      toast({ variant: 'destructive', title: 'Not enough files', description: 'Please select at least two PDF files to merge.' });
      return;
    }

    setIsProcessing(true);
    setProcessingMessage('Processing files...');

    try {
      const allPageObjects: PageObject[] = [];
      let pageIdCounter = 0;

      for (let fileIndex = 0; fileIndex < selectedFiles.length; fileIndex++) {
        const file = selectedFiles[fileIndex];
        setProcessingMessage(`Reading ${file.name}...`);
        
        const fileBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBuffer);
        const imageUrls = await renderPdfPagesToImageUrls(new Uint8Array(fileBuffer));
        
        for (let pageIndex = 0; pageIndex < pdfDoc.getPageCount(); pageIndex++) {
          allPageObjects.push({
            id: pageIdCounter++,
            thumbnailUrl: imageUrls[pageIndex],
            originalFileIndex: fileIndex,
            originalPageIndex: pageIndex,
            fileName: file.name
          });
        }
      }
      
      setPages(allPageObjects);
      setStep('reorder');
      toast({ title: 'Files Ready', description: 'Drag and drop pages to reorder them.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not process the PDF files.' });
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
  
  const handleFinalize = async () => {
      setIsProcessing(true);
      setProcessingMessage('Creating final PDF...');

      try {
        const finalPdf = await PDFDocument.create();

        for (const page of pages) {
            const sourceFile = selectedFiles[page.originalFileIndex];
            const sourceBuffer = await sourceFile.arrayBuffer();
            const sourcePdf = await PDFDocument.load(sourceBuffer);
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
            <CardContent className="p-10">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
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
          {selectedFiles.length > 0 && (
             <div className="mt-8">
               <h3 className="text-lg font-medium text-center mb-4">Selected Files ({selectedFiles.length})</h3>
               <div className="space-y-2 max-h-60 overflow-y-auto pr-2 border rounded-lg p-4">
                {selectedFiles.map((file, index) => (
                  <div key={file.name + index} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{Math.round(file.size / 1024)} KB</Badge>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveFile(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-6">
                <Button onClick={handleStartMerge} size="lg">
                    Merge Files
                </Button>
              </div>
             </div>
          )}
        </div>
      );
    
    case 'reorder':
      return (
        <div className="w-full max-w-6xl mx-auto">
           <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Organize Your Pages</h1>
            <p className="text-muted-foreground mt-2">Drag and drop the pages to reorder them as you like.</p>
          </div>
          <Card>
            <CardContent className="p-6">
              <div
                onDragOver={e => e.preventDefault()}
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
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-center gap-4 mt-8">
            <Button onClick={handleStartOver} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Start Over
            </Button>
            <Button onClick={handleFinalize} size="lg">
                <Wand2 className="mr-2 h-4 w-4" /> Create Merged PDF
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
