
'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Wand2, ArrowLeft, FileImage, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ConvertStep = 'upload' | 'download';

interface UploadedImage {
  file: File;
  url: string;
}

export function JpgToPdfClient() {
  const [step, setStep] = useState<ConvertStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [selectedImages, setSelectedImages] = useState<UploadedImage[]>([]);
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob } | null>(null);
  
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreFilesInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Clean up object URLs on unmount
    return () => {
      selectedImages.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, [selectedImages]);

  const handleFileSelectClick = () => fileInputRef.current?.click();
  const handleAddMoreFilesClick = () => addMoreFilesInputRef.current?.click();

  const processFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type === 'image/jpeg');
    
    if (imageFiles.length !== files.length) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only JPG/JPEG files are supported.',
      });
    }

    const newImages = imageFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setSelectedImages(prev => {
      return [...prev, ...newImages];
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
    
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []);
    processFiles(files);
  };

  const handleRemoveImage = (index: number) => {
    const imageToRemove = selectedImages[index];
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageDragStart = (index: number) => {
    setDraggedImageIndex(index);
  };

  const handleImageDragEnter = (index: number) => {
    if (draggedImageIndex === null || draggedImageIndex === index) return;
    
    setSelectedImages(currentImages => {
        const newImages = [...currentImages];
        const draggedItem = newImages.splice(draggedImageIndex, 1)[0];
        newImages.splice(index, 0, draggedItem);
        setDraggedImageIndex(index);
        return newImages;
    });
  };

  const handleImageDragEnd = () => {
    setDraggedImageIndex(null);
  };
  
  const handleConvert = async () => {
    if (selectedImages.length === 0) {
      toast({ variant: 'destructive', title: 'No files selected', description: 'Please select one or more JPG files to convert.'});
      return;
    }

    setIsProcessing(true);
    setProcessingMessage('Converting images to PDF...');

    try {
        const newPdfDoc = await PDFDocument.create();
        
        for(let i = 0; i < selectedImages.length; i++) {
            const image = selectedImages[i];
            setProcessingMessage(`Processing image ${i + 1} of ${selectedImages.length}...`);
            
            const imageBytes = await image.file.arrayBuffer();
            const jpgImage = await newPdfDoc.embedJpg(imageBytes);

            const page = newPdfDoc.addPage([jpgImage.width, jpgImage.height]);
            page.drawImage(jpgImage, {
                x: 0,
                y: 0,
                width: jpgImage.width,
                height: jpgImage.height
            });
        }

        const pdfBytes = await newPdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        setOutputFile({ name: `converted_document.pdf`, blob });
        setStep('download');
        toast({ title: 'Conversion Complete!', description: 'Your new PDF is ready for download.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not convert the images.' });
      handleStartOver();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setStep('upload');
    selectedImages.forEach(img => URL.revokeObjectURL(img.url));
    setSelectedImages([]);
    setOutputFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (addMoreFilesInputRef.current) addMoreFilesInputRef.current.value = '';
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
            <h1 className="text-3xl font-bold">JPG to PDF</h1>
            <p className="text-muted-foreground mt-2">Combine one or more JPG images into a single, easy-to-share PDF file.</p>
          </div>
          <Card className="border-2 border-dashed" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
            <CardContent className="p-10">
              {selectedImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="bg-secondary p-4 rounded-full">
                    <UploadCloud className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium">Drag & drop JPG files here</p>
                  <p className="text-muted-foreground">or</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/jpeg"
                    multiple
                  />
                  <Button size="lg" onClick={handleFileSelectClick}>Select Files</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-center mb-4">Selected Images ({selectedImages.length})</h3>
                   <div 
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-2"
                    onDragOver={(e) => e.preventDefault()}
                  >
                    {selectedImages.map((image, index) => (
                      <div 
                        key={image.url} 
                        className={cn(
                          "relative group aspect-square cursor-grab transition-opacity",
                          draggedImageIndex === index && "opacity-50"
                        )}
                        draggable
                        onDragStart={() => handleImageDragStart(index)}
                        onDragEnter={() => handleImageDragEnter(index)}
                        onDragEnd={handleImageDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        <img src={image.url} alt={image.file.name} className="rounded-md w-full h-full object-cover"/>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-white text-center">
                            <p className="text-xs font-bold truncate w-full">{image.file.name}</p>
                            <p className="text-xs">{Math.round(image.file.size / 1024)} KB</p>
                        </div>
                        <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={() => handleRemoveImage(index)}>
                            <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center gap-4 pt-4 border-t">
                    <input
                        type="file"
                        ref={addMoreFilesInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/jpeg"
                        multiple
                    />
                    <Button onClick={handleAddMoreFilesClick} variant="outline">Add More Files</Button>
                    <Button onClick={handleConvert} size="lg">
                      <Wand2 className="mr-2 h-4 w-4" />
                      Convert to PDF
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    
    case 'download':
        return (
            <div className="w-full max-w-4xl mx-auto text-center">
                 <div className="mb-8">
                    <h1 className="text-3xl font-bold">Conversion Complete!</h1>
                    <p className="text-muted-foreground mt-2">Your images have been successfully converted to a PDF.</p>
                </div>
                <div className="flex justify-center gap-4">
                    <Button onClick={handleStartOver} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Convert More
                    </Button>
                    <Button onClick={handleDownloadFile} size="lg">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
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
