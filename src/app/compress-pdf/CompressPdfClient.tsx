'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Wand2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Configure the pdf.js worker.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type CompressStep = 'upload' | 'options' | 'download';
type CompressionLevel = 'extreme' | 'recommended' | 'less' | 'custom';

export function CompressPdfClient() {
  const [step, setStep] = useState<CompressStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('recommended');
  
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob, originalSize: number, newSize: number } | null>(null);
  
  const [targetSize, setTargetSize] = useState('');
  const [targetUnit, setTargetUnit] = useState<'KB' | 'MB'>('MB');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelectClick = () => fileInputRef.current?.click();

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setOriginalFile(file);
      setStep('options');
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
      setStep('options');
    } else if (file) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only PDF files are supported for dropping.',
      });
    }
  };
  
  const handleCompress = async () => {
    if (!originalFile) return;

    setIsProcessing(true);
    setProcessingMessage('Compressing PDF...');

    try {
        const fileBuffer = await originalFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: fileBuffer });
        const sourcePdf = await loadingTask.promise;
        
        const newPdfDoc = await PDFDocument.create();
        
        let quality: number;
        let scale: number;

        if (compressionLevel === 'custom') {
            const sizeInBytes = (targetUnit === 'MB' ? parseFloat(targetSize) * 1024 * 1024 : parseFloat(targetSize) * 1024);
            const compressionRatio = sizeInBytes / originalFile.size;

            if (compressionRatio >= 1) {
                quality = 0.95;
                scale = 2.0;
            } else if (compressionRatio > 0.5) {
                quality = 0.8;
                scale = 1.5;
            } else if (compressionRatio > 0.2) {
                quality = 0.6;
                scale = 1.0;
            } else {
                quality = 0.4;
                scale = 0.8;
            }

        } else {
            switch(compressionLevel) {
              case 'extreme':
                quality = 0.5;
                scale = 1.0; 
                break;
              case 'less':
                quality = 0.9;
                scale = 2.0;
                break;
              case 'recommended':
              default:
                quality = 0.75;
                scale = 1.5;
                break;
            }
        }


        for (let i = 1; i <= sourcePdf.numPages; i++) {
            setProcessingMessage(`Processing page ${i} of ${sourcePdf.numPages}...`);
            
            const page = await sourcePdf.getPage(i);
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) throw new Error("Could not get canvas context");

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: context, viewport }).promise;
            
            const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
            const jpegImage = await newPdfDoc.embedJpg(jpegDataUrl);
            
            const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
            newPage.drawImage(jpegImage, {
                x: 0,
                y: 0,
                width: viewport.width,
                height: viewport.height,
            });
            canvas.width = 0;
            canvas.height = 0;
        }

        const pdfBytes = await newPdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        const originalSize = originalFile.size;
        const newSize = blob.size;

        setOutputFile({ name: `${originalFile!.name.replace('.pdf', '')}_compressed.pdf`, blob, originalSize, newSize });
        setStep('download');
        toast({ title: 'Compression Complete!', description: 'Your optimized PDF is ready for download.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not compress the PDF.' });
      handleStartOver();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setStep('upload');
    setOriginalFile(null);
    setOutputFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleGoBackToOptions = () => {
    setOutputFile(null);
    setStep('options');
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
            <h1 className="text-3xl font-bold">Compress PDF</h1>
            <p className="text-muted-foreground mt-2">Reduce the file size of your PDF while optimizing for maximal quality.</p>
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
    
    case 'options':
      return (
        <div className="w-full max-w-xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Compression Options</h1>
            <p className="text-muted-foreground mt-2">Choose how much you want to compress your file.</p>
          </div>
          <Card>
            <CardContent className="p-6">
                <div className="mb-4 p-4 bg-muted/50 rounded-lg border">
                    <p className="text-sm font-medium text-foreground truncate">{originalFile?.name}</p>
                    <p className="text-sm text-muted-foreground">Original size: {formatBytes(originalFile?.size || 0)}</p>
                </div>
                 <RadioGroup value={compressionLevel} onValueChange={(v: string) => setCompressionLevel(v as CompressionLevel)} className="space-y-1">
                    <Label htmlFor="level-extreme" className="flex items-center gap-4 p-4 border rounded-md cursor-pointer hover:bg-accent has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                      <RadioGroupItem value="extreme" id="level-extreme" />
                      <div>
                        <p className="font-semibold">Extreme compression</p>
                        <p className="text-sm text-muted-foreground">Lowest quality, smallest size.</p>
                      </div>
                    </Label>
                    <Label htmlFor="level-recommended" className="flex items-center gap-4 p-4 border rounded-md cursor-pointer hover:bg-accent has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                      <RadioGroupItem value="recommended" id="level-recommended" />
                      <div>
                        <p className="font-semibold">Recommended compression</p>
                        <p className="text-sm text-muted-foreground">Good quality, good compression.</p>
                      </div>
                    </Label>
                    <Label htmlFor="level-less" className="flex items-center gap-4 p-4 border rounded-md cursor-pointer hover:bg-accent has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                      <RadioGroupItem value="less" id="level-less" />
                      <div>
                        <p className="font-semibold">Less compression</p>
                        <p className="text-sm text-muted-foreground">Highest quality, larger size.</p>
                      </div>
                    </Label>
                     <Label htmlFor="level-custom" className="flex flex-col items-start gap-4 p-4 border rounded-md cursor-pointer hover:bg-accent has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                        <div className="flex items-center gap-4">
                            <RadioGroupItem value="custom" id="level-custom" />
                            <div>
                                <p className="font-semibold">Custom compression</p>
                                <p className="text-sm text-muted-foreground">Set a target file size (estimation).</p>
                            </div>
                        </div>
                        {compressionLevel === 'custom' && (
                            <div className="flex items-center gap-2 w-full pl-8 pt-2">
                                <Input 
                                    type="number" 
                                    placeholder="e.g., 2" 
                                    value={targetSize}
                                    onChange={e => setTargetSize(e.target.value)}
                                    className="w-full"
                                />
                                <Select value={targetUnit} onValueChange={(v: 'KB' | 'MB') => setTargetUnit(v)}>
                                    <SelectTrigger className="w-[80px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="KB">KB</SelectItem>
                                        <SelectItem value="MB">MB</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </Label>
                </RadioGroup>
            </CardContent>
          </Card>
           <div className="flex justify-center gap-4 mt-8">
              <Button onClick={handleStartOver} variant="outline">Back</Button>
              <Button onClick={handleCompress} size="lg">
                <Wand2 className="mr-2 h-4 w-4" />
                Compress PDF
              </Button>
            </div>
        </div>
      );

    case 'download':
        const { originalSize, newSize } = outputFile || { originalSize: 0, newSize: 0 };
        const savings = originalSize > 0 ? Math.round(((originalSize - newSize) / originalSize) * 100) : 0;
        return (
            <div className="w-full max-w-xl mx-auto text-center">
                 <div className="mb-8">
                    <h1 className="text-3xl font-bold">Compression Complete!</h1>
                    <p className="text-muted-foreground mt-2">Your PDF has been compressed successfully.</p>
                </div>
                <Card className="mb-8">
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                        <div className="py-4 px-2">
                           <p className="text-sm text-muted-foreground">Original Size</p>
                           <p className="text-2xl font-bold">{formatBytes(originalSize)}</p>
                        </div>
                        <div className="py-4 px-2">
                            <p className="text-sm text-muted-foreground">New Size</p>
                            <p className="text-2xl font-bold">{formatBytes(newSize)}</p>
                        </div>
                        <div className="py-4 px-2">
                            <p className="text-sm text-muted-foreground">You saved</p>
                            <p className="text-2xl font-bold text-green-600">{savings}%</p>
                        </div>
                    </CardContent>
                </Card>
                <div className="flex justify-center gap-4">
                    <Button onClick={handleStartOver} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Compress Another
                    </Button>
                    <Button onClick={handleDownloadFile} size="lg">
                        <Download className="mr-2 h-4 w-4" />
                        Download Compressed PDF
                    </Button>
                </div>
                 <div className="flex justify-center mt-4">
                    <Button onClick={handleGoBackToOptions} variant="link">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Options
                    </Button>
                </div>
            </div>
        )
  }
}

    