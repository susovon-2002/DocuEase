'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Wand2, ArrowLeft, FileImage, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ConvertStep = 'upload' | 'download';

export function JpgToPdfClient() {
  const [step, setStep] = useState<ConvertStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreFilesInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelectClick = () => fileInputRef.current?.click();
  const handleAddMoreFilesClick = () => addMoreFilesInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type === 'image/jpeg');
    
    if (imageFiles.length !== files.length) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only JPG/JPEG files are supported.',
      });
    }

    setSelectedFiles(prev => [...prev, ...imageFiles]);
    
    // Reset file input to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []);
    const imageFiles = files.filter(file => file.type === 'image/jpeg');

    if (imageFiles.length !== files.length) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only JPG/JPEG files are supported for dropping.',
      });
    }
    
    setSelectedFiles(prev => [...prev, ...imageFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleConvert = async () => {
    if (selectedFiles.length === 0) {
      toast({ variant: 'destructive', title: 'No files selected', description: 'Please select one or more JPG files to convert.'});
      return;
    }

    setIsProcessing(true);
    setProcessingMessage('Converting images to PDF...');

    try {
        const newPdfDoc = await PDFDocument.create();
        
        for(let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            setProcessingMessage(`Processing image ${i + 1} of ${selectedFiles.length}...`);
            
            const imageBytes = await file.arrayBuffer();
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
    setSelectedFiles([]);
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
              {selectedFiles.length === 0 ? (
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
                  <h3 className="text-lg font-medium text-center">Selected Files</h3>
                   <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {selectedFiles.map((file, index) => (
                      <div key={file.name + index} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileImage className="h-5 w-5 text-muted-foreground flex-shrink-0" />
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
                  <div className="flex justify-center gap-4 pt-4">
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
