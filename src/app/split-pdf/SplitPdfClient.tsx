'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, File as FileIcon, X, Download, RefreshCw, Scissors, FileBox, Wand2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { renderPdfPagesToImageUrls } from '@/lib/pdf-utils';
import { PageThumbnail } from '../merge-pdf/PageThumbnail';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';

type PageObject = {
  id: number;
  thumbnailUrl: string;
  pageNumber: number;
  pdfBytes: Uint8Array;
};

type SplitStep = 'upload' | 'options' | 'download';
type SplitMode = 'ranges' | 'extract';

type Range = {
  from: string;
  to: string;
};

export function SplitPdfClient() {
  const [step, setStep] = useState<SplitStep>('upload');
  const [splitMode, setSplitMode] = useState<SplitMode>('ranges');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [allPages, setAllPages] = useState<PageObject[]>([]);
  
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [splitRanges, setSplitRanges] = useState<Range[]>([{ from: '', to: '' }]);
  
  const [outputFiles, setOutputFiles] = useState<{ name: string; blob: Blob }[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // File Upload Handlers
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

  // Process uploaded file
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
      const pdfDoc = await PDFDocument.load(fileBuffer);
      
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
      
      setAllPages(pageObjects);
      setStep('options');
      toast({ title: 'PDF Loaded', description: 'Select how you want to split your document.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not load the PDF.' });
      handleStartOver();
    } finally {
      setIsProcessing(false);
    }
  };

  // Split Logic Handlers
  const handleTogglePageSelection = (pageNumber: number) => {
    setSelectedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageNumber)) {
        newSet.delete(pageNumber);
      } else {
        newSet.add(pageNumber);
      }
      return newSet;
    });
  };

  const handleRangeChange = (index: number, field: 'from' | 'to', value: string) => {
    const newRanges = [...splitRanges];
    newRanges[index][field] = value.replace(/[^0-9]/g, '');
    setSplitRanges(newRanges);
  };

  const addRange = () => setSplitRanges([...splitRanges, { from: '', to: '' }]);
  const removeRange = (index: number) => setSplitRanges(splitRanges.filter((_, i) => i !== index));

  // Final Processing
  const handleSplit = async () => {
    setIsProcessing(true);
    setProcessingMessage('Splitting PDF...');

    try {
      let generatedFiles: { name: string; blob: Blob }[] = [];
      const originalPdfDoc = await PDFDocument.load(await originalFile!.arrayBuffer());

      if (splitMode === 'ranges') {
        generatedFiles = await splitByRanges(originalPdfDoc);
      } else if (splitMode === 'extract') {
        generatedFiles = await extractSelectedPages(originalPdfDoc);
      }

      if (generatedFiles.length > 0) {
        setOutputFiles(generatedFiles);
        setStep('download');
        toast({ title: 'PDF Split Successfully!', description: 'Your new documents are ready for download.' });
      } else {
        toast({ variant: 'destructive', title: 'No pages selected', description: 'Please define ranges or select pages to split.' });
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Splitting Failed', description: error.message || 'An unexpected error occurred.' });
      setIsProcessing(false);
    }
  };

  const splitByRanges = async (originalPdfDoc: PDFDocument) => {
    const files = [];
    const pageCount = originalPdfDoc.getPageCount();
    
    for (const [i, range] of splitRanges.entries()) {
      const from = parseInt(range.from, 10);
      const to = parseInt(range.to, 10);

      if (isNaN(from) || isNaN(to) || from < 1 || to > pageCount || from > to) {
        if (!isNaN(from) || !isNaN(to)) {
           throw new Error(`Invalid range provided: ${range.from}-${range.to}. Please check your page numbers.`);
        }
        continue;
      }
      
      const newPdf = await PDFDocument.create();
      const pageIndices = Array.from({ length: to - from + 1 }, (_, k) => from + k - 1);
      const copiedPages = await newPdf.copyPages(originalPdfDoc, pageIndices);
      copiedPages.forEach(p => newPdf.addPage(p));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      files.push({ name: `${originalFile!.name.replace('.pdf', '')}_range_${range.from}-${range.to}.pdf`, blob });
    }
    return files;
  };

  const extractSelectedPages = async (originalPdfDoc: PDFDocument) => {
    if (selectedPages.size === 0) return [];
    
    const newPdf = await PDFDocument.create();
    const sortedPageNumbers = Array.from(selectedPages).sort((a,b) => a - b);
    const pageIndices = sortedPageNumbers.map(n => n - 1);

    const copiedPages = await newPdf.copyPages(originalPdfDoc, pageIndices);
    copiedPages.forEach(p => newPdf.addPage(p));

    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    return [{ name: `${originalFile!.name.replace('.pdf', '')}_extracted.pdf`, blob }];
  };


  // General UI and State handlers
  const handleStartOver = () => {
    setStep('upload');
    setOriginalFile(null);
    allPages.forEach(p => URL.revokeObjectURL(p.thumbnailUrl));
    setAllPages([]);
    setSelectedPages(new Set());
    setSplitRanges([{ from: '', to: '' }]);
    setOutputFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleGoBackToOptions = () => {
    setOutputFiles([]);
    setStep('options');
  };

  const handleDownloadFile = (file: { name: string; blob: Blob }) => {
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleDownloadAllAsZip = async () => {
    setIsProcessing(true);
    setProcessingMessage("Zipping files...");
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for(const file of outputFiles) {
        zip.file(file.name, file.blob);
      }
      const zipBlob = await zip.generateAsync({type: "blob"});
      handleDownloadFile({ name: `${originalFile!.name.replace('.pdf','')}_split.zip`, blob: zipBlob });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Zip Creation Failed', description: 'Could not create the zip file.' });
    } finally {
       setIsProcessing(false);
    }
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

  // RENDER LOGIC
  switch (step) {
    case 'upload':
      return (
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Split PDF</h1>
            <p className="text-muted-foreground mt-2">Separate one page or a whole set for easy conversion into independent PDF files.</p>
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
    
    case 'options':
      return (
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Choose How to Split</h1>
            <p className="text-muted-foreground mt-2">Select your preferred method to split the document.</p>
          </div>

          <Tabs value={splitMode} onValueChange={(v) => setSplitMode(v as SplitMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ranges"><Scissors className="mr-2 h-4 w-4" />Split by range</TabsTrigger>
              <TabsTrigger value="extract"><FileBox className="mr-2 h-4 w-4" />Extract pages</TabsTrigger>
            </TabsList>
            <TabsContent value="ranges" className="mt-6">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <p className="text-muted-foreground">Define page ranges to be split into separate PDF files. For example, a 10-page document with a range of 1-5 will create one PDF with the first 5 pages.</p>
                    {splitRanges.map((range, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="text"
                          placeholder="From page"
                          value={range.from}
                          onChange={(e) => handleRangeChange(index, 'from', e.target.value)}
                          className="w-full"
                        />
                        <span>-</span>
                        <Input
                          type="text"
                          placeholder="To page"
                          value={range.to}
                          onChange={(e) => handleRangeChange(index, 'to', e.target.value)}
                           className="w-full"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeRange(index)} disabled={splitRanges.length <= 1}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" onClick={addRange}>Add range</Button>
                  </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="extract" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground mb-4">Click on the pages you want to extract into a single new PDF. Selected pages are highlighted.</p>
                     <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 p-4 rounded-lg border max-h-[50vh] overflow-y-auto">
                        {allPages.map(page => (
                          <div
                            key={page.id}
                            className={cn(
                              "relative rounded-md shadow-md cursor-pointer transition-all",
                              "ring-2 ring-transparent hover:ring-primary",
                              selectedPages.has(page.pageNumber) && "ring-primary ring-offset-2"
                            )}
                            onClick={() => handleTogglePageSelection(page.pageNumber)}
                          >
                            <PageThumbnail thumbnailUrl={page.thumbnailUrl} pageNumber={page.pageNumber} />
                          </div>
                        ))}
                      </div>
                  </CardContent>
                </Card>
            </TabsContent>
          </Tabs>

           <div className="flex justify-center gap-4 mt-8">
              <Button onClick={handleStartOver} variant="outline">Back</Button>
              <Button onClick={handleSplit} size="lg">
                <Wand2 className="mr-2 h-4 w-4" />
                Split PDF
              </Button>
            </div>
        </div>
      );

    case 'download':
        return (
            <div className="w-full max-w-4xl mx-auto text-center">
                 <div className="mb-8">
                    <h1 className="text-3xl font-bold">Split Complete!</h1>
                    <p className="text-muted-foreground mt-2">Your new documents are ready. Download them below.</p>
                </div>

                <Card className="mb-8">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="font-semibold text-lg">Your Files ({outputFiles.length})</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 border rounded-lg p-2">
                            {outputFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                        <span className="text-sm truncate">{file.name}</span>
                                    </div>
                                    <Button size="sm" onClick={() => handleDownloadFile(file)} variant="secondary">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-center gap-4">
                     <Button onClick={handleGoBackToOptions} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    {outputFiles.length > 1 ? (
                        <Button onClick={handleDownloadAllAsZip} size="lg">
                            <Download className="mr-2 h-4 w-4" />
                            Download All (.zip)
                        </Button>
                    ) : (
                       <Button onClick={() => handleDownloadFile(outputFiles[0])} size="lg">
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>
                    )}
                </div>
                 <div className="flex justify-center mt-4">
                    <Button onClick={handleStartOver} variant="link">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Split Another File
                    </Button>
                </div>
            </div>
        )
  }
}
