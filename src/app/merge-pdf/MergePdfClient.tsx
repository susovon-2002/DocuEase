
'use client';

import { useState, useRef, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, ChevronsRight, Eye, ArrowLeft, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PageThumbnail } from './PageThumbnail';
import { renderPdfPagesToImageUrls } from '@/lib/pdf-utils';
import { useUser, useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

type PageObject = {
  id: number;
  thumbnailUrl: string;
  originalPageIndex: number;
};

type FileObject = {
  id: number;
  file: File;
  thumbnailUrl: string;
};

type MergeStep = 'select_files' | 'reorder_pages' | 'preview_final';

export function MergePdfClient() {
  const [step, setStep] = useState<MergeStep>('select_files');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [selectedFiles, setSelectedFiles] = useState<FileObject[]>([]);
  const [pages, setPages] = useState<PageObject[]>([]);
  const [mergedPdfBytes, setMergedPdfBytes] = useState<Uint8Array | null>(null);
  const [finalPdfUrl, setFinalPdfUrl] = useState<string | null>(null);
  
  const [draggedFileIndex, setDraggedFileIndex] = useState<number | null>(null);
  const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleFileSelectClick = () => {
    fileInputRef.current?.click();
  };

  const processNewFiles = async (files: File[]) => {
    setIsProcessing(true);
    setProcessingMessage('Generating thumbnails...');
    const newFileObjects: FileObject[] = [];
    for (const file of files) {
      if (file.type !== 'application/pdf') {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: `${file.name} is not a PDF.`,
        });
        continue;
      }
      try {
        const fileBuffer = await file.arrayBuffer();
        const [thumbnailUrl] = await renderPdfPagesToImageUrls(new Uint8Array(fileBuffer));
        newFileObjects.push({ id: Date.now() + Math.random(), file, thumbnailUrl });
      } catch (e) {
        console.error("Failed to process file for thumbnail", e);
        toast({ variant: 'destructive', title: 'Could not preview file', description: `Error processing ${file.name}.` });
      }
    }
    setSelectedFiles(prev => [...prev, ...newFileObjects]);
    setIsProcessing(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      processNewFiles(Array.from(files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      processNewFiles(Array.from(files));
    }
  };

  const handleRemoveFile = (id: number) => {
    const fileToRemove = selectedFiles.find(f => f.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.thumbnailUrl);
    }
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };
  
  const handleFileDragStart = (index: number) => setDraggedFileIndex(index);
  const handleFileDragEnter = (index: number) => {
    if (draggedFileIndex === null || draggedFileIndex === index) return;
    const newFiles = [...selectedFiles];
    const draggedItem = newFiles.splice(draggedFileIndex, 1)[0];
    newFiles.splice(index, 0, draggedItem);
    setSelectedFiles(newFiles);
    setDraggedFileIndex(index);
  };
  const handleFileDragEnd = () => setDraggedFileIndex(null);

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

  const goToPageReorderStep = async () => {
    if (selectedFiles.length < 1) {
      toast({ variant: 'destructive', title: 'No files selected', description: 'Please select at least one PDF file.' });
      return;
    }
    setIsProcessing(true);
    setProcessingMessage('Merging files...');

    try {
      const mergedPdfDoc = await PDFDocument.create();
      for (const fileObject of selectedFiles) {
        const fileBuffer = await fileObject.file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdfDoc.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => mergedPdfDoc.addPage(page));
      }

      setProcessingMessage('Generating thumbnails...');
      
      const tempMergedBytes = await mergedPdfDoc.save();
      setMergedPdfBytes(tempMergedBytes); // Preserve the merged PDF data
      
      const imageUrls = await renderPdfPagesToImageUrls(tempMergedBytes);
      const pageObjects: PageObject[] = imageUrls.map((url, i) => ({
        id: Date.now() + i,
        thumbnailUrl: url,
        originalPageIndex: i,
      }));

      setPages(pageObjects);
      setStep('reorder_pages');
      toast({ title: 'Files Merged', description: 'Now you can reorder the individual pages below.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: error instanceof Error ? error.message : 'Could not process the PDFs.' });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const goToPreviewStep = async () => {
    if (!mergedPdfBytes || pages.length === 0) {
      toast({ variant: 'destructive', title: 'Processing Error', description: 'No source PDF or pages available. Please start over.'});
      return;
    }

    setIsProcessing(true);
    setProcessingMessage('Finalizing PDF...');
    try {
      const finalPdfDoc = await PDFDocument.create();
      const sourcePdfDoc = await PDFDocument.load(mergedPdfBytes);

      const pageIndicesToCopy = pages.map(p => p.originalPageIndex);
      
      const copiedPages = await finalPdfDoc.copyPages(sourcePdfDoc, pageIndicesToCopy);
      copiedPages.forEach(page => finalPdfDoc.addPage(page));
      
      const finalPdfBytes = await finalPdfDoc.save();
      const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      
      if (finalPdfUrl) {
        URL.revokeObjectURL(finalPdfUrl);
      }
      const url = URL.createObjectURL(blob);
      setFinalPdfUrl(url);

      if (user && firestore) {
        // This is a fire-and-forget operation, no need to await
        addDoc(collection(firestore, `users/${user.uid}/toolUsages`), {
          toolName: 'Merge PDF',
          usageTimestamp: serverTimestamp(),
          details: `${selectedFiles.length} files merged.`
        });
      }

      setStep('preview_final');
      toast({ title: 'PDF Finalized', description: 'Your document is ready for preview and download.' });
    } catch (error) {
       console.error(error);
      toast({ variant: 'destructive', title: 'Could not generate the final PDF', description: error instanceof Error ? error.message : 'An unexpected error occurred.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    if (finalPdfUrl) URL.revokeObjectURL(finalPdfUrl);
    setFinalPdfUrl(null);
    selectedFiles.forEach(f => URL.revokeObjectURL(f.thumbnailUrl));
    setSelectedFiles([]);
    pages.forEach(p => URL.revokeObjectURL(p.thumbnailUrl));
    setPages([]);
    setMergedPdfBytes(null);
    setStep('select_files');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGoBackToReorder = () => {
    if (finalPdfUrl) URL.revokeObjectURL(finalPdfUrl);
    setFinalPdfUrl(null);
    setStep('reorder_pages');
  };

  const handleDownload = () => {
    if (!finalPdfUrl) return;
    const a = document.createElement('a');
    a.href = finalPdfUrl;
    a.download = 'merged_document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

  // --- RENDER LOGIC ---

  if (step === 'select_files') {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Merge PDF</h1>
          <p className="text-muted-foreground mt-2">Combine multiple PDF documents into one. Rearrange and organize files as you like.</p>
        </div>
        <Card className="border-2 border-dashed" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
          <CardContent className="p-10">
              <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                  accept="application/pdf"
                />
            {selectedFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="bg-secondary p-4 rounded-full">
                  <UploadCloud className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">Drag & drop PDF files here</p>
                <p className="text-muted-foreground">or</p>
                <Button size="lg" onClick={handleFileSelectClick}>Select Files</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-center">Selected Files ({selectedFiles.length})</h3>
                <p className="text-sm text-muted-foreground text-center">Drag and drop to reorder files.</p>
                <div
                  onDragOver={e => e.preventDefault()}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-2"
                >
                  {selectedFiles.map((fileObj, index) => (
                    <div
                      key={fileObj.id}
                      className={cn("relative group rounded-md shadow-md cursor-grab", draggedFileIndex === index && "opacity-50")}
                      draggable
                      onDragStart={() => handleFileDragStart(index)}
                      onDragEnter={() => handleFileDragEnter(index)}
                      onDragEnd={handleFileDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      <PageThumbnail thumbnailUrl={fileObj.thumbnailUrl} pageNumber={index + 1} fileName={fileObj.file.name} />
                      <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveFile(fileObj.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                    <div className="flex items-center justify-center border-2 border-dashed rounded-md">
                      <Button variant="ghost" className="w-full h-full" onClick={handleFileSelectClick}>
                          <UploadCloud className="mr-2 h-4 w-4" /> Add More
                      </Button>
                  </div>
                </div>
                <div className="flex justify-center gap-4 mt-6">
                    <Button onClick={handleStartOver} variant="outline">Clear All</Button>
                    <Button size="lg" onClick={goToPageReorderStep}>
                    <ChevronsRight className="mr-2 h-4 w-4" /> Merge & Reorder
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'reorder_pages') {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Organize Your Pages</h1>
          <p className="text-muted-foreground mt-2">Drag and drop the pages to set your desired order.</p>
        </div>
        <div className="flex justify-center gap-4 mb-8">
          <Button onClick={handleStartOver} variant="outline">Back to Files</Button>
          <Button onClick={goToPreviewStep} size="lg">
            <Eye className="mr-2 h-4 w-4" />Preview Final PDF
          </Button>
        </div>
        <div onDragOver={e => e.preventDefault()} className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 p-4 rounded-lg border bg-secondary/50">
          {pages.map((page, index) => (
              <div key={page.id} className={cn("relative rounded-md shadow-md cursor-grab transition-opacity", draggedPageIndex === index && "opacity-50")} draggable onDragStart={() => handlePageDragStart(index)} onDragEnter={() => handlePageDragEnter(index)} onDragEnd={handlePageDragEnd} onDragOver={(e) => e.preventDefault()}>
              <PageThumbnail thumbnailUrl={page.thumbnailUrl} pageNumber={index + 1} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'preview_final') {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Preview Your Final PDF</h1>
            <p className="text-muted-foreground mt-2">Review the document below. If it looks good, download it.</p>
        </div>
        <div className="flex justify-center gap-4 mb-8">
            <Button onClick={handleGoBackToReorder} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Back to Reorder</Button>
            <Button onClick={handleDownload} size="lg"><Download className="mr-2 h-4 w-4" />Download Final PDF</Button>
        </div>
        <Card>
          <CardContent className="p-2">
            <iframe src={finalPdfUrl!} className="w-full h-[70vh] border-0" title="Final PDF Preview" />
          </CardContent>
        </Card>
          <div className="flex justify-center mt-4">
            <Button onClick={handleStartOver} variant="link"><RefreshCw className="mr-2 h-4 w-4" />Merge Another</Button>
        </div>
      </div>
    );
  }

  return null;
}
