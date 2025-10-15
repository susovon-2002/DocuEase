'use client';

import { useState, useRef } from 'react';
import PptxGenJS from 'pptxgenjs';
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
  
  const [outputFileName, setOutputFileName] = useState<string>('');
  
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
    // Create a blank data URL for a white slide (aspect ratio 16:9)
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
    setProcessingMessage('Building your presentation...');

    try {
        const pptx = new PptxGenJS();
        
        for (const slide of slides) {
            const newSlide = pptx.addSlide();
            newSlide.addImage({
                data: slide.imageUrl,
                x: 0,
                y: 0,
                w: '100%',
                h: '100%',
            });
        }
        
        const fileName = `${originalFile?.name.replace('.pdf', '') || 'presentation'}.pptx`;
        setOutputFileName(fileName);
        await pptx.writeFile({ fileName });
        
        toast({ title: 'Presentation Ready!', description: 'Your PowerPoint file has been downloaded.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not create the presentation file.' });
    } finally {
      setIsProcessing(false);
      // We don't move to a download step as the file is downloaded directly.
      // User can continue editing or start over.
    }
  };

  const handleStartOver = () => {
    setStep('upload');
    setOriginalFile(null);
    slides.forEach(s => URL.revokeObjectURL(s.imageUrl));
    setSlides([]);
    setOutputFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
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
                                <Download className="mr-2 h-4 w-4" />
                                Download PPTX
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );

    // No 'download' case needed as the file is downloaded directly
    default:
        return null;
  }
}
