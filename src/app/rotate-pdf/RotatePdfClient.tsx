'use client';

import { useState, useRef, useCallback } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, RotateCcw, RotateCw, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { renderPdfPagesToImageUrls } from '@/lib/pdf-utils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type PageObject = {
  id: number;
  thumbnailUrl: string;
  rotation: number; // in degrees
};

type RotateStep = 'upload' | 'rotate' | 'download';

export function RotatePdfClient() {
  const [step, setStep] = useState<RotateStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [allPages, setAllPages] = useState<PageObject[]>([]);
  
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelectClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setOriginalFile(file);
      processOriginalFile(file);
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
      processOriginalFile(file);
    } else if (file) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only PDF files are supported for dropping.',
      });
    }
  };

  const processOriginalFile = async (file: File) => {
    setIsProcessing(true);
    setProcessingMessage('Reading PDF...');
    
    try {
      const fileBuffer = await file.arrayBuffer();
      
      setProcessingMessage('Generating thumbnails...');
      const imageUrls = await renderPdfPagesToImageUrls(new Uint8Array(fileBuffer));
      
      const pdfDoc = await PDFDocument.load(fileBuffer);

      const pageObjects: PageObject[] = [];
      for (let i = 0; i < imageUrls.length; i++) {
        const page = pdfDoc.getPage(i);
        pageObjects.push({ 
          id: Date.now() + i, 
          thumbnailUrl: imageUrls[i],
          rotation: page.getRotation().angle,
        });
      }
      
      setAllPages(pageObjects);
      setStep('rotate');
      toast({ title: 'PDF Loaded', description: 'You can now rotate individual pages or all pages at once.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not load the PDF.' });
      handleStartOver();
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleRotatePage = (index: number, angle: number) => {
    setAllPages(prevPages => {
      const newPages = [...prevPages];
      const newRotation = (newPages[index].rotation + angle) % 360;
      newPages[index] = { ...newPages[index], rotation: newRotation < 0 ? 360 + newRotation : newRotation };
      return newPages;
    });
  };

  const handleRotateAll = (angle: number) => {
    setAllPages(prevPages =>
      prevPages.map(page => {
        const newRotation = (page.rotation + angle) % 360;
        return { ...page, rotation: newRotation < 0 ? 360 + newRotation : newRotation };
      })
    );
  };

  const handleApplyRotation = async () => {
    setIsProcessing(true);
    setProcessingMessage('Applying rotations...');

    try {
      const originalPdfDoc = await PDFDocument.load(await originalFile!.arrayBuffer());
      
      allPages.forEach((pageState, index) => {
        const page = originalPdfDoc.getPage(index);
        page.setRotation(degrees(pageState.rotation));
      });

      const pdfBytes = await originalPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      setOutputFile({ name: `${originalFile!.name.replace('.pdf', '')}_rotated.pdf`, blob });
      setStep('download');
      toast({ title: 'Rotation Complete!', description: 'Your new document is ready for download.' });

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
    setOutputFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleGoBackToRotate = () => {
    setOutputFile(null);
    setStep('rotate');
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
            <h1 className="text-3xl font-bold">Rotate PDF</h1>
            <p className="text-muted-foreground mt-2">Rotate one or all pages in your PDF. You can rotate them 90 degrees clockwise, counter-clockwise, or 180 degrees.</p>
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
    
    case 'rotate':
      return (
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Rotate Pages</h1>
            <p className="text-muted-foreground mt-2">Click the buttons to rotate pages, then apply your changes.</p>
          </div>
          
           <div className="flex justify-center gap-4 mt-8 mb-8">
              <Button onClick={handleStartOver} variant="outline">Back</Button>
              <Button onClick={() => handleRotateAll(-90)} variant="secondary">
                <RotateCcw className="mr-2 h-4 w-4" />
                Rotate All Left
              </Button>
              <Button onClick={() => handleRotateAll(90)} variant="secondary">
                <RotateCw className="mr-2 h-4 w-4" />
                Rotate All Right
              </Button>
              <Button onClick={handleApplyRotation} size="lg">
                Apply Changes
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 p-4 rounded-lg border max-h-[60vh] overflow-y-auto">
                    {allPages.map((page, index) => (
                      <div
                        key={page.id}
                        className="space-y-2 flex flex-col items-center"
                      >
                         <div
                          className="relative group rounded-md shadow-md"
                        >
                           <div className="aspect-[2/3] w-full bg-white rounded-md overflow-hidden ring-1 ring-gray-200">
                             <img src={page.thumbnailUrl} alt={`Page ${index + 1}`} className="w-full h-full object-contain transition-transform" style={{ transform: `rotate(${page.rotation}deg)` }}/>
                           </div>
                           <Badge className="absolute bottom-1 right-1" variant="secondary">{index + 1}</Badge>
                           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                             <Button size="icon" variant="secondary" onClick={() => handleRotatePage(index, -90)}>
                               <RotateCcw className="h-5 w-5" />
                             </Button>
                              <Button size="icon" variant="secondary" onClick={() => handleRotatePage(index, 90)}>
                               <RotateCw className="h-5 w-5" />
                             </Button>
                           </div>
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
                    <p className="text-muted-foreground mt-2">Your rotated PDF is ready. Download it below.</p>
                </div>
                <div className="flex justify-center gap-4">
                    <Button onClick={handleGoBackToRotate} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Editor
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
