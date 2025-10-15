'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, FilePieChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { renderPdfPagesToImageUrls } from '@/lib/pdf-utils';
import { Input } from '@/components/ui/input';

type ConvertStep = 'upload' | 'download';

export function PdfToPowerpointClient() {
  const [step, setStep] = useState<ConvertStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [outputImages, setOutputImages] = useState<string[]>([]);
  
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
    setProcessingMessage('Converting PDF to images...');

    try {
        const fileBuffer = await file.arrayBuffer();
        
        setProcessingMessage('Rendering pages...');
        const imageUrls = await renderPdfPagesToImageUrls(new Uint8Array(fileBuffer));
        
        setOutputImages(imageUrls);
        setStep('download');
        toast({ title: 'Conversion Complete!', description: 'Your images are ready to be added to PowerPoint.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not convert the PDF.' });
      handleStartOver();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setStep('upload');
    setOriginalFile(null);
    outputImages.forEach(url => URL.revokeObjectURL(url));
    setOutputImages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadAllAsZip = async () => {
    if (outputImages.length === 0) return;

    setIsProcessing(true);
    setProcessingMessage('Creating ZIP file...');

    try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        for (let i = 0; i < outputImages.length; i++) {
            const url = outputImages[i];
            const response = await fetch(url);
            const blob = await response.blob();
            // Using PNG because the render function uses PNG for better quality
            zip.file(`${originalFile?.name.replace('.pdf','') || 'slide'}_${i + 1}.png`, blob);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `${originalFile?.name.replace('.pdf','')}__slides.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (error) {
        console.error("Error creating ZIP file:", error);
        toast({
            variant: "destructive",
            title: "ZIP Creation Failed",
            description: "Could not create the zip file."
        });
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

  switch (step) {
    case 'upload':
      return (
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">PDF to PowerPoint</h1>
            <p className="text-muted-foreground mt-2">Convert each page of your PDF into high-quality images for your presentations.</p>
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
    
    case 'download':
        return (
            <div className="w-full max-w-4xl mx-auto text-center">
                 <div className="mb-8">
                    <h1 className="text-3xl font-bold">Conversion Complete!</h1>
                    <p className="text-muted-foreground mt-2">Your PDF pages have been converted to images. Download them as a ZIP file and add them to your PowerPoint presentation.</p>
                </div>
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Image Preview</CardTitle>
                        <CardDescription>{outputImages.length} images generated. Ready to be used as slides.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                        {outputImages.map((src, index) => (
                            <div key={index} className="relative">
                                <img src={src} alt={`Page ${index + 1}`} className="rounded-md w-full aspect-video object-contain bg-muted" />
                                <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full">
                                    Slide {index + 1}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <div className="flex justify-center gap-4">
                    <Button onClick={handleStartOver} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Convert Another
                    </Button>
                    <Button onClick={handleDownloadAllAsZip} size="lg">
                        <Download className="mr-2 h-4 w-4" />
                        Download Slides (.zip)
                    </Button>
                </div>
            </div>
        )
  }
}
