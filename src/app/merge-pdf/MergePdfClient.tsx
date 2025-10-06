'use client';

import { useState, useRef, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2, File as FileIcon, X, UploadCloud, GripVertical, Download, RefreshCw, ChevronsRight, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PageThumbnail } from './PageThumbnail';
import { renderPdfPagesToImageUrls } from '@/lib/pdf-utils';
import { Input } from '@/components/ui/input';

type PageObject = {
  id: number;
  pdfBytes: Uint8Array;
  thumbnailUrl: string;
};

type MergeStep = 'select_files' | 'reorder_pages' | 'preview_final';


export function MergePdfClient() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [draggedFileIndex, setDraggedFileIndex] = useState<number | null>(null);
  const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null);
  
  const [pages, setPages] = useState<PageObject[]>([]);
  const [finalPdfUrl, setFinalPdfUrl] = useState<string | null>(null);
  const [step, setStep] = useState<MergeStep>('select_files');
  const [pageOrderInput, setPageOrderInput] = useState('');


  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files).filter(file => file.type === 'application/pdf');
      if (newFiles.length !== files.length) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Only PDF files are supported.',
        });
      }
      setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files).filter(file => file.type === 'application/pdf');
       if (newFiles.length !== files.length) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Only PDF files are supported for dropping.',
        });
      }
      setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };

  const handleClearFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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


  const handleInitialMerge = async () => {
    if (selectedFiles.length < 1) {
      toast({
        variant: 'destructive',
        title: 'No files selected',
        description: 'Please select at least one PDF file.',
      });
      return;
    }
    setIsProcessing(true);
    setProcessingMessage('Merging files...');

    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of selectedFiles) {
        const fileBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }

      setProcessingMessage('Generating thumbnails...');
      
      const mergedPdfBytes = await mergedPdf.save();
      const imageUrls = await renderPdfPagesToImageUrls(mergedPdfBytes);

      const pageObjects: PageObject[] = [];
      const pageCount = mergedPdf.getPageCount();
      for (let i = 0; i < pageCount; i++) {
        const singlePagePdf = await PDFDocument.create();
        const [copiedPage] = await singlePagePdf.copyPages(mergedPdf, [i]);
        singlePagePdf.addPage(copiedPage);
        const pdfBytes = await singlePagePdf.save();
        pageObjects.push({ 
            id: Date.now() + i, 
            pdfBytes,
            thumbnailUrl: imageUrls[i]
        });
      }

      setPages(pageObjects);
      setPageOrderInput(Array.from({ length: pageObjects.length }, (_, i) => i + 1).join(', '));
      setStep('reorder_pages');
      toast({
        title: 'Files Merged',
        description: 'Now you can reorder the individual pages below.'
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: error instanceof Error ? error.message : 'Could not process the PDFs. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleFinalizePdf = async () => {
    setIsProcessing(true);
    setProcessingMessage('Finalizing PDF...');
    try {
      const finalPdf = await PDFDocument.create();
      for (const pageObject of pages) {
        const pdf = await PDFDocument.load(pageObject.pdfBytes);
        const [copiedPage] = await finalPdf.copyPages(pdf, [0]);
        finalPdf.addPage(copiedPage);
      }
      const finalPdfBytes = await finalPdf.save();
      const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setFinalPdfUrl(url);
      setStep('preview_final');
      toast({
        title: 'PDF Finalized',
        description: 'Your final document is ready for preview and download.'
      })
    } catch (error) {
       console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Could not generate the final PDF.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    if(finalPdfUrl) URL.revokeObjectURL(finalPdfUrl);
    setFinalPdfUrl(null);
    setSelectedFiles([]);
    pages.forEach(p => URL.revokeObjectURL(p.thumbnailUrl)); // Clean up blob URLs
    setPages([]);
    setPageOrderInput('');
    setStep('select_files');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const handleGoBackToReorder = () => {
    setFinalPdfUrl(null);
    setStep('reorder_pages');
  };

  const handleDownload = () => {
    if(!finalPdfUrl) return;
    const a = document.createElement('a');
    a.href = finalPdfUrl;
    a.download = 'merged.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const handleReorderFromInput = () => {
    const newOrder = pageOrderInput.split(/,| /).filter(n => n.trim() !== '').map(n => parseInt(n.trim(), 10));

    if (newOrder.some(isNaN)) {
      toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please enter only comma-separated numbers.' });
      return;
    }

    if (newOrder.length !== pages.length) {
      toast({ variant: 'destructive', title: 'Incorrect Page Count', description: `Please provide exactly ${pages.length} page numbers.`});
      return;
    }

    const newOrderSet = new Set(newOrder);
    if (newOrderSet.size !== pages.length) {
      toast({ variant: 'destructive', title: 'Duplicate Page Numbers', description: 'Each page number must be unique.' });
      return;
    }

    const maxPage = Math.max(...newOrder);
    if (maxPage > pages.length) {
      toast({ variant: 'destructive', title: 'Invalid Page Number', description: `The maximum page number is ${pages.length}.` });
      return;
    }

    const reorderedPages: PageObject[] = [];
    let isValid = true;
    for (const pageNum of newOrder) {
      const pageIndex = pageNum - 1;
      if (pageIndex >= 0 && pageIndex < pages.length) {
        const foundPage = pages.find((_p, index) => index === pageIndex);
        if (foundPage) {
           reorderedPages.push(foundPage);
        } else {
           isValid = false;
           break;
        }
      } else {
        isValid = false;
        break;
      }
    }
    
    // This logic needs to be revisited to handle indexes vs page content correctly
    const tempPages = newOrder.map(num => pages[num - 1]).filter(Boolean);


    if(tempPages.length === pages.length) {
        setPages(tempPages);
        toast({ title: 'Pages Reordered', description: 'The pages have been arranged according to your input.' });
    } else {
        toast({ variant: 'destructive', title: 'Reordering Failed', description: 'Could not reorder pages. Please check your input.' });
        setPageOrderInput(Array.from({ length: pages.length }, (_, i) => i + 1).join(', '));
    }
  };


  if (step === 'preview_final') {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Preview Your Final PDF</h1>
            <p className="text-muted-foreground mt-2">Review the document below. If it looks good, download it.</p>
        </div>
        <div className="flex justify-center gap-4 mb-8">
           <Button onClick={handleGoBackToReorder} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleDownload} size="lg">
              <Download className="mr-2 h-4 w-4" />
              Download Final PDF
            </Button>
        </div>
        <Card>
          <CardContent className="p-2">
            <iframe src={finalPdfUrl!} className="w-full h-[70vh] border-0" title="Final PDF Preview" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'reorder_pages') {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Organize Your Pages</h1>
          <p className="text-muted-foreground mt-2">Drag and drop the pages to set your desired order, or use the input below.</p>
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
            <label htmlFor="pageOrder" className="font-medium flex-shrink-0">Page Order:</label>
            <Input 
              id="pageOrder"
              placeholder="e.g., 1, 3, 2, 4"
              value={pageOrderInput}
              onChange={(e) => setPageOrderInput(e.target.value)}
              className="flex-grow"
            />
            <Button onClick={handleReorderFromInput} variant="secondary">
              Apply Order
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4 mb-8">
          <Button onClick={() => setStep('select_files')} variant="outline">Back</Button>
          <Button onClick={handleFinalizePdf} size="lg" disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChevronsRight className="mr-2 h-4 w-4" />}
            {isProcessing ? processingMessage : 'Generate Final PDF'}
          </Button>
        </div>
        <div 
          onDragOver={e => e.preventDefault()}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4 rounded-lg border"
        >
          {pages.map((page, index) => (
             <div
              key={page.id}
              className={cn("relative rounded-md shadow-md cursor-grab transition-opacity", draggedPageIndex === index && "opacity-50")}
              draggable
              onDragStart={() => handlePageDragStart(index)}
              onDragEnter={() => handlePageDragEnter(index)}
              onDragEnd={handlePageDragEnd}
              onDragOver={(e) => e.preventDefault()}
            >
              <PageThumbnail thumbnailUrl={page.thumbnailUrl} pageNumber={index + 1} />
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  return (
     <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Merge PDF</h1>
        <p className="text-muted-foreground mt-2">Combine multiple PDF documents into one. Rearrange and organize files as you like.</p>
      </div>
      <Card className="border-2 border-dashed" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
        <CardContent className="p-10 text-center">
          {selectedFiles.length === 0 ? (
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
                multiple
                accept="application/pdf"
              />
              <Button size="lg" onClick={handleFileSelectClick}>
                Select Files
              </Button>
              <p className="text-xs text-muted-foreground mt-4">Only PDF files are supported.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Selected Files</h3>
              <p className="text-sm text-muted-foreground">Drag and drop to reorder files.</p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={file.name + index}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md bg-muted/50 cursor-grab",
                      draggedFileIndex === index && "bg-primary/20 opacity-50"
                    )}
                    draggable
                    onDragStart={() => handleFileDragStart(index)}
                    onDragEnter={() => handleFileDragEnter(index)}
                    onDragEnd={handleFileDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{Math.round(file.size / 1024)} KB</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-4 mt-4">
                 <Button onClick={handleFileSelectClick} variant="outline">Add More Files</Button>
                 <Button size="lg" disabled={isProcessing} onClick={handleInitialMerge}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {processingMessage}
                    </>
                  ) : (
                    <>
                      Merge & Reorder Pages <ChevronsRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
