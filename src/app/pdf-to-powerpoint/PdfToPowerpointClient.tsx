'use client';

import { useState, useRef } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Wand2, ArrowLeft, X, PlusSquare, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { renderPdfPagesToImageUrls } from '@/lib/pdf-utils';
import { cn } from '@/lib/utils';

type Slide = {
  id: number;
  imageUrl: string; // data URL
  type: 'pdf-page' | 'blank';
};

type ConvertStep = 'upload' | 'edit' | 'download';

export function PdfToPowerpointClient() {
  const [step, setStep] = useState<ConvertStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null);
  
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelectClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setOriginalFile(file);
      handleConvert(file);
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
      handleConvert(file);
    } else if (file) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only PDF files are supported for dropping.',
      });
    }
  };
  
  const handleConvert = async (file: File) => {
    setIsProcessing(true);
    setProcessingMessage('Converting PDF to slides...');

    try {
        const fileBuffer = await file.arrayBuffer();
        
        setProcessingMessage('Rendering pages...');
        const imageUrls = await renderPdfPagesToImageUrls(new Uint8Array(fileBuffer));
        
        const initialSlides = imageUrls.map((url, index) => ({
            id: Date.now() + index,
            imageUrl: url,
            type: 'pdf-page' as const
        }));
        
        setSlides(initialSlides);
        setStep('edit');
        toast({ title: 'Conversion Complete!', description: 'Your PDF pages are now ready to be arranged as slides.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not convert the PDF.' });
      handleStartOver();
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleAddBlankSlide = () => {
    // Create a blank data URL for a white slide
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    const blankImageUrl = canvas.toDataURL('image/png');

    const newSlide: Slide = {
        id: Date.now(),
        imageUrl: blankImageUrl,
        type: 'blank',
    };
    setSlides(prev => [...prev, newSlide]);
  };
  
  const handleDeleteSlide = (id: number) => {
      setSlides(prev => prev.filter(slide => slide.id !== id));
  };
  
  const handleDragStart = (index: number) => setDraggedSlideIndex(index);
  const handleDragEnter = (index: number) => {
    if (draggedSlideIndex === null || draggedSlideIndex === index) return;
    
    setSlides(currentSlides => {
        const newSlides = [...currentSlides];
        const draggedItem = newSlides.splice(draggedSlideIndex, 1)[0];
        newSlides.splice(index, 0, draggedItem);
        setDraggedSlideIndex(index);
        return newSlides;
    });
  };
  const handleDragEnd = () => setDraggedSlideIndex(null);


  const handleExportPresentation = async () => {
    if (slides.length === 0) return;
    setIsProcessing(true);
    setProcessingMessage('Building your presentation PDF...');

    try {
        const newPdfDoc = await PDFDocument.create();
        
        for (const slide of slides) {
            const imageBytes = await fetch(slide.imageUrl).then(res => res.arrayBuffer());
            let image;
            if (slide.imageUrl.startsWith('data:image/png')) {
                image = await newPdfDoc.embedPng(imageBytes);
            } else {
                image = await newPdfDoc.embedJpg(imageBytes);
            }
            
            const page = newPdfDoc.addPage([image.width, image.height]);
            page.drawImage(image, {
                x: 0, y: 0,
                width: page.getWidth(),
                height: page.getHeight()
            });
        }
        
        const pdfBytes = await newPdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        setOutputFile({ name: `${originalFile?.name.replace('.pdf', '')}_presentation.pdf`, blob });
        setStep('download');
        toast({ title: 'Presentation Ready!', description: 'Your new presentation PDF is ready to download.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not create the final presentation.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setStep('upload');
    setOriginalFile(null);
    slides.forEach(s => URL.revokeObjectURL(s.imageUrl));
    setSlides([]);
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
            <h1 className="text-3xl font-bold">PDF to PowerPoint</h1>
            <p className="text-muted-foreground mt-2">Convert your PDF into an editable slide presentation.</p>
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
            <div className="w-full max-w-7xl mx-auto">
                 <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold">Build Your Presentation</h1>
                    <p className="text-muted-foreground mt-2">Drag to reorder slides, add blank slides, or delete unwanted ones.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Slide sorter */}
                    <div className="lg:w-1/4">
                       <Card>
                         <CardContent className="p-4 space-y-4">
                            <Button onClick={handleAddBlankSlide} className="w-full" variant="outline">
                                <PlusSquare className="mr-2 h-4 w-4" />
                                Add Blank Slide
                            </Button>
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                                {slides.map((slide, index) => (
                                    <div 
                                        key={slide.id}
                                        className={cn(
                                            "p-2 rounded-md border bg-background flex items-center gap-2 cursor-grab transition-opacity",
                                            draggedSlideIndex === index && "opacity-50"
                                        )}
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragEnter={() => handleDragEnter(index)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => e.preventDefault()}
                                    >
                                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                                        <span className="font-mono text-sm text-muted-foreground w-6">{index + 1}</span>
                                        <img src={slide.imageUrl} alt={`Slide ${index+1}`} className="w-20 aspect-video object-contain rounded-sm bg-muted" />
                                        <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={() => handleDeleteSlide(slide.id)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                         </CardContent>
                       </Card>
                    </div>

                    {/* Main preview and actions */}
                    <div className="lg:w-3/4 flex-grow flex flex-col gap-6">
                        <Card className="flex-grow">
                             <CardContent className="p-4 h-full">
                                {slides.length > 0 ? (
                                    <img src={slides[0].imageUrl} alt="Main slide preview" className="w-full h-full object-contain rounded-md bg-muted" />
                                ) : (
                                    <div className="flex items-center justify-center h-full rounded-md bg-muted text-muted-foreground">
                                        Your slides will appear here
                                    </div>
                                )}
                             </CardContent>
                        </Card>
                        <div className="flex justify-center gap-4">
                            <Button onClick={handleStartOver} variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Start Over
                            </Button>
                            <Button onClick={handleExportPresentation} size="lg">
                                <Wand2 className="mr-2 h-4 w-4" />
                                Export as Presentation
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );

    case 'download':
        return (
            <div className="w-full max-w-4xl mx-auto text-center">
                 <div className="mb-8">
                    <h1 className="text-3xl font-bold">Presentation Ready!</h1>
                    <p className="text-muted-foreground mt-2">Your presentation has been exported as a PDF.</p>
                </div>
                <Card className="mb-8">
                    <CardContent className="p-2">
                        {outputFile && <iframe src={URL.createObjectURL(outputFile.blob)} className="w-full h-[70vh] border-0" title="Final PDF Preview" />}
                    </CardContent>
                </Card>
                <div className="flex justify-center gap-4">
                    <Button onClick={handleGoBackToEdit} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Editor
                    </Button>
                    <Button onClick={handleDownloadFile} size="lg">
                        <Download className="mr-2 h-4 w-4" />
                        Download Presentation
                    </Button>
                </div>
                 <div className="flex justify-center mt-4">
                    <Button onClick={handleStartOver} variant="link">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Convert Another
                    </Button>
                </div>
            </div>
        )
  }
}
