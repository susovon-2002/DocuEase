'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Wand2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type EditStep = 'upload' | 'edit' | 'download';

type TextItem = {
  str: string;
  transform: number[];
  width: number;
  height: number;
  dir: string;
  fontName: string;
};

type PageData = {
  pageIndex: number;
  width: number;
  height: number;
  imageUrl: string;
  textItems: TextItem[];
};

type EditAction = {
  pageIndex: number;
  itemIndex: number;
  newText: string;
};

export function EditPdfClient() {
  const [step, setStep] = useState<EditStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [pagesData, setPagesData] = useState<PageData[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const [edits, setEdits] = useState<Record<string, string>>({});
  
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelectClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setOriginalFile(file);
    } else if (file) {
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'Only PDF files are supported.' });
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      setOriginalFile(file);
    } else if (file) {
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'Only PDF files are supported for dropping.' });
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
    setProcessingMessage('Analyzing PDF...');
    
    try {
      const fileBuffer = await originalFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
      const allPagesData: PageData[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        setProcessingMessage(`Processing page ${i} of ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        if(!context) throw new Error('Could not get canvas context');

        await page.render({ canvasContext: context, viewport }).promise;
        const imageUrl = canvas.toDataURL('image/png');

        const textContent = await page.getTextContent();
        const textItems = textContent.items.map(item => item as TextItem);
        
        allPagesData.push({
          pageIndex: i - 1,
          width: viewport.width,
          height: viewport.height,
          imageUrl,
          textItems,
        });
      }
      
      setPagesData(allPagesData);
      setStep('edit');
      toast({ title: 'PDF Loaded', description: 'Click on text to start editing.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not load the PDF for editing.' });
      handleStartOver();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextChange = (pageIndex: number, itemIndex: number, newText: string) => {
    const key = `${pageIndex}-${itemIndex}`;
    setEdits(prev => ({ ...prev, [key]: newText }));
  };
  
  const handleApplyEdits = async () => {
      const editActions = Object.keys(edits).length;
      if (editActions === 0) {
        toast({ variant: 'destructive', title: 'No Edits Made', description: 'Please make some changes before applying.' });
        return;
      }
      
      setIsProcessing(true);
      setProcessingMessage("Applying changes...");
      
      try {
        const pdfDoc = await PDFDocument.load(await originalFile!.arrayBuffer());
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        for (const key in edits) {
            const [pageIndexStr, itemIndexStr] = key.split('-');
            const pageIndex = parseInt(pageIndexStr, 10);
            const itemIndex = parseInt(itemIndexStr, 10);
            const newText = edits[key];

            const pageData = pagesData[pageIndex];
            const item = pageData.textItems[itemIndex];
            
            const page = pdfDoc.getPage(pageIndex);
            const { width: pageWidth, height: pageHeight } = page.getSize();
            const viewportScale = pageData.width / pageWidth;

            const [fontSize, , , fontHeight, x, y] = item.transform;
            const itemWidthOnPdf = item.width / viewportScale;
            
            // pdf-lib's y-coordinate starts from the bottom, so we need to convert
            const yInPdfCoords = pageHeight - (y / viewportScale);

            // Cover the old text with a white rectangle
            page.drawRectangle({
                x: x / viewportScale,
                y: yInPdfCoords - (fontHeight / viewportScale),
                width: itemWidthOnPdf + 2, // a little extra to cover artifacts
                height: (fontSize / viewportScale) + 2,
                color: rgb(1, 1, 1), // white background
            });
            
            // Draw the new text
            page.drawText(newText, {
                x: x / viewportScale,
                y: yInPdfCoords,
                font: helveticaFont,
                size: (fontSize / viewportScale) * 0.95, // slight adjustment for font differences
                color: rgb(0, 0, 0),
            });
        }
        
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        setOutputFile({ name: `${originalFile!.name.replace('.pdf', '')}_edited.pdf`, blob });
        setStep('download');
        toast({ title: "Edits Applied", description: "Your document has been updated." });

      } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Failed to Apply Edits", description: "Could not save changes to the PDF." });
      } finally {
        setIsProcessing(false);
      }
  };


  const handleStartOver = () => {
    setStep('upload');
    setOriginalFile(null);
    pagesData.forEach(p => URL.revokeObjectURL(p.imageUrl));
    setPagesData([]);
    setCurrentPageIndex(0);
    setEdits({});
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
  
  const currentView = pagesData[currentPageIndex];
  
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
            <h1 className="text-3xl font-bold">Edit PDF</h1>
            <p className="text-muted-foreground mt-2">Modify text, images, and links directly in your PDF. A simple and effective online editor.</p>
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
    
    case 'edit':
      return (
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Edit Your Document</h1>
            <p className="text-muted-foreground mt-2">Click on any text block to modify it.</p>
          </div>
          
           <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 mb-8">
              <Button onClick={handleStartOver} variant="outline">Start Over</Button>
              <div className="flex items-center gap-2">
                 <Button onClick={() => setCurrentPageIndex(p => Math.max(0, p - 1))} disabled={currentPageIndex === 0}>
                    Previous
                </Button>
                <span className="text-sm font-medium">Page {currentPageIndex + 1} of {pagesData.length}</span>
                 <Button onClick={() => setCurrentPageIndex(p => Math.min(pagesData.length - 1, p + 1))} disabled={currentPageIndex === pagesData.length - 1}>
                    Next
                </Button>
              </div>
              <Button onClick={handleApplyEdits} size="lg" disabled={Object.keys(edits).length === 0}>
                <Wand2 className="mr-2 h-4 w-4" />
                Apply All Edits ({Object.keys(edits).length})
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-2">
                 <div 
                    className="relative mx-auto overflow-auto"
                    style={{ width: currentView?.width, height: currentView?.height, maxWidth: '100%' }}
                >
                    <img src={currentView?.imageUrl} alt={`Page ${currentPageIndex + 1}`} className="w-full h-auto select-none" draggable={false} />
                    <div className="absolute top-0 left-0 w-full h-full">
                        {currentView?.textItems.map((item, index) => {
                            const [fontSize, , , fontHeight, x, y] = item.transform;
                            const key = `${currentPageIndex}-${index}`;
                            const isEdited = key in edits;
                            const value = isEdited ? edits[key] : item.str;

                            return (
                                <input
                                    key={key}
                                    type="text"
                                    value={value}
                                    onChange={(e) => handleTextChange(currentPageIndex, index, e.target.value)}
                                    className="absolute bg-transparent border border-transparent hover:border-blue-500 focus:border-blue-500 focus:outline-none p-0"
                                    style={{
                                        left: `${x}px`,
                                        top: `${y}px`,
                                        width: `${item.width}px`,
                                        height: `${item.height}px`,
                                        fontFamily: 'sans-serif', // Use a common font
                                        fontSize: `${fontSize}px`,
                                        lineHeight: 1,
                                        color: isEdited ? 'black' : 'transparent',
                                    }}
                                />
                            )
                        })}
                    </div>
                 </div>
              </CardContent>
            </Card>
        </div>
      );

    case 'download':
        return (
            <div className="w-full max-w-4xl mx-auto text-center">
                 <div className="mb-8">
                    <h1 className="text-3xl font-bold">Edits Complete!</h1>
                    <p className="text-muted-foreground mt-2">Your edited document is ready for download.</p>
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
                        Edit Another File
                    </Button>
                </div>
                <Card className="mt-8">
                    <CardContent className="p-2">
                        <iframe src={URL.createObjectURL(outputFile!.blob)} className="w-full h-[70vh] border-0" title="Edited PDF Preview" />
                    </CardContent>
                </Card>
            </div>
        )
  }
}
