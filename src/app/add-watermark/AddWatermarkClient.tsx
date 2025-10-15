'use client';

import { useState, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts, degrees, PageSizes } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Wand2, ArrowLeft, Type, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type WatermarkStep = 'upload' | 'options' | 'download';
type WatermarkType = 'text' | 'image';
type Position = 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'tiled';

interface AddWatermarkClientProps {
    onPageCountChange: (count: number) => void;
}

export function AddWatermarkClient({ onPageCountChange }: AddWatermarkClientProps) {
  const [step, setStep] = useState<WatermarkStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  
  // Watermark options
  const [watermarkType, setWatermarkType] = useState<WatermarkType>('text');
  const [text, setText] = useState('CONFIDENTIAL');
  const [textColor, setTextColor] = useState('#ff0000');
  const [fontSize, setFontSize] = useState(50);
  const [opacity, setOpacity] = useState(0.5);
  const [rotation, setRotation] = useState(-45);
  const [position, setPosition] = useState<Position>('center');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelectClick = () => fileInputRef.current?.click();
  const handleImageSelectClick = () => imageInputRef.current?.click();

  const processFile = async (file: File | null) => {
    if (!file) return;
     if (file.type === 'application/pdf') {
        setOriginalFile(file);
        try {
            const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
            onPageCountChange(pdfDoc.getPageCount());
        } catch (e) {
            console.error('Failed to count pages', e);
            onPageCountChange(0); // Assume 0 if it fails
        }
      setStep('options');
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only PDF files are supported.',
      });
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file || null);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    processFile(file || null);
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
        setImageFile(file);
    } else if (file) {
        toast({ variant: 'destructive', title: 'Unsupported Image', description: 'Please select a PNG or JPG file.' });
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255,
        }
      : { r: 0, g: 0, b: 0 };
  };
  
  const handleAddWatermark = async () => {
    if (!originalFile) return;
    if (watermarkType === 'image' && !imageFile) {
        toast({ variant: 'destructive', title: 'No Image Selected', description: 'Please select an image file for the watermark.' });
        return;
    }

    setIsProcessing(true);
    setProcessingMessage('Adding watermark...');

    try {
        const fileBuffer = await originalFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBuffer);
        
        let watermarkObject: { type: 'text' | 'image'; content: any; width?: number; height?: number } | null = null;

        if (watermarkType === 'text') {
            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const textWidth = font.widthOfTextAtSize(text, fontSize);
            watermarkObject = { type: 'text', content: { font, text }, width: textWidth, height: fontSize };
        } else if (imageFile) {
            const imageBuffer = await imageFile.arrayBuffer();
            const image = imageFile.type === 'image/png' 
                ? await pdfDoc.embedPng(imageBuffer)
                : await pdfDoc.embedJpg(imageBuffer);
            watermarkObject = { type: 'image', content: image, width: image.width, height: image.height };
        }
        
        if (!watermarkObject) throw new Error('Watermark object could not be created.');

        const pages = pdfDoc.getPages();
        const color = hexToRgb(textColor);

        for (let i = 0; i < pages.length; i++) {
            setProcessingMessage(`Processing page ${i + 1} of ${pages.length}...`);
            const page = pages[i];
            const { width: pageWidth, height: pageHeight } = page.getSize();
            
            const drawOptions: any = {
                opacity,
                rotate: degrees(rotation),
            };

            const drawWatermark = (x: number, y: number) => {
                if (watermarkObject!.type === 'text') {
                    page.drawText(watermarkObject!.content.text, {
                        ...drawOptions,
                        x, y,
                        font: watermarkObject!.content.font,
                        size: fontSize,
                        color: rgb(color.r, color.g, color.b),
                    });
                } else {
                    page.drawImage(watermarkObject!.content, {
                        ...drawOptions,
                        x, y,
                        width: watermarkObject!.width! / 2, // Scale down image
                        height: watermarkObject!.height! / 2,
                    });
                }
            };
            
            if (position === 'tiled') {
                for (let x = -pageWidth; x < pageWidth * 2; x += watermarkObject.width! + 100) {
                  for (let y = -pageHeight; y < pageHeight * 2; y += watermarkObject.height! + 100) {
                     drawWatermark(x, y);
                  }
                }
            } else {
                 let x = 0, y = 0;
                 const wmWidth = (watermarkObject.width || 0) / 2;
                 const wmHeight = (watermarkObject.height || 0) / 2;
                 const margin = 50;

                 switch(position) {
                    case 'center':
                        x = pageWidth / 2 - wmWidth / 2;
                        y = pageHeight / 2 - wmHeight / 2;
                        break;
                    case 'bottom-left':
                        x = margin;
                        y = margin;
                        break;
                    case 'bottom-right':
                        x = pageWidth - wmWidth - margin;
                        y = margin;
                        break;
                    case 'top-left':
                        x = margin;
                        y = pageHeight - wmHeight - margin;
                        break;
                    case 'top-right':
                        x = pageWidth - wmWidth - margin;
                        y = pageHeight - wmHeight - margin;
                        break;
                 }
                 drawWatermark(x, y);
            }
        }
        
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        setOutputFile({ name: `${originalFile!.name.replace('.pdf', '')}_watermarked.pdf`, blob });
        setStep('download');
        toast({ title: 'Watermark Added!', description: 'Your PDF is ready for download.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not add the watermark.' });
      handleStartOver();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setStep('upload');
    setOriginalFile(null);
    setOutputFile(null);
    onPageCountChange(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
    setImageFile(null);
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
            <h1 className="text-3xl font-bold">Add Watermark</h1>
            <p className="text-muted-foreground mt-2">Stamp an image or text over your PDF in seconds. Choose the typography, transparency, and position.</p>
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
        <div className="w-full max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Watermark Options</h1>
            <p className="text-muted-foreground mt-2">Customize your watermark's appearance and position.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
              <Tabs value={watermarkType} onValueChange={(v) => setWatermarkType(v as WatermarkType)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text"><Type className="mr-2 h-4 w-4" />Add Text</TabsTrigger>
                  <TabsTrigger value="image"><ImageIcon className="mr-2 h-4 w-4" />Add Image</TabsTrigger>
                </TabsList>
                <TabsContent value="text" className="mt-6">
                    <Card>
                      <CardContent className="p-6 grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="text-content">Text</Label>
                            <Input id="text-content" value={text} onChange={(e) => setText(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="text-color">Color</Label>
                            <Input id="text-color" type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-10 p-1" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="font-size">Font Size</Label>
                            <Input id="font-size" type="number" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value, 10))} />
                        </div>
                      </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="image" className="mt-6">
                     <Card>
                      <CardContent className="p-6 space-y-4">
                         <div>
                             <Label>Image File</Label>
                             <input type="file" ref={imageInputRef} onChange={handleImageFileChange} className="hidden" accept="image/png, image/jpeg" />
                             <Button onClick={handleImageSelectClick} variant="outline" className="w-full mt-2">
                               {imageFile ? <span className="truncate">{imageFile.name}</span> : 'Select Image'}
                             </Button>
                         </div>
                      </CardContent>
                    </Card>
                </TabsContent>
              </Tabs>
              
               <Card>
                  <CardContent className="p-6 grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Select value={position} onValueChange={(v) => setPosition(v as Position)}>
                            <SelectTrigger id="position">
                                <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="tiled">Tiled</SelectItem>
                                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                                <SelectItem value="top-right">Top Right</SelectItem>
                                <SelectItem value="top-left">Top Left</SelectItem>
                            </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rotation">Rotation ({rotation}°)</Label>
                        <Slider id="rotation" min={-180} max={180} step={1} value={[rotation]} onValueChange={(v) => setRotation(v[0])} />
                      </div>
                       <div className="space-y-2">
                        <Label htmlFor="opacity">Transparency ({Math.round(opacity * 100)}%)</Label>
                        <Slider id="opacity" min={0} max={1} step={0.1} value={[opacity]} onValueChange={(v) => setOpacity(v[0])} />
                      </div>
                  </CardContent>
                </Card>

               <div className="flex flex-col gap-4">
                  <Button onClick={handleAddWatermark} size="lg">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Add Watermark
                  </Button>
                  <Button onClick={handleStartOver} variant="outline">Back</Button>
                </div>
            </div>
            <div className="md:col-span-2">
                <Card>
                    <CardContent className="p-2">
                        {originalFile && <iframe src={URL.createObjectURL(originalFile)} className="w-full h-[80vh] border-0" title="Original PDF Preview" />}
                    </CardContent>
                </Card>
            </div>
          </div>
        </div>
      );

    case 'download':
        return (
            <div className="w-full max-w-4xl mx-auto text-center">
                 <div className="mb-8">
                    <h1 className="text-3xl font-bold">Process Complete!</h1>
                    <p className="text-muted-foreground mt-2">Your watermarked PDF is ready to download.</p>
                </div>
                <div className="flex justify-center gap-4">
                     <Button onClick={handleGoBackToOptions} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Options
                    </Button>
                    <Button onClick={handleDownloadFile} size="lg">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                </div>
                 <div className="flex justify-center mt-4">
                     <Button onClick={handleStartOver} variant="link">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Process Another File
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
