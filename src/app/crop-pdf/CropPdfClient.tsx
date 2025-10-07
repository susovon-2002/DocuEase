'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Wand2, ArrowLeft, Crop } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Rnd } from 'react-rnd';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type CropStep = 'upload' | 'crop' | 'download';

interface PageInfo {
  pageNumber: number;
  width: number;
  height: number;
  imageUrl: string;
}

export function CropPdfClient() {
  const [step, setStep] = useState<CropStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [pageInfos, setPageInfos] = useState<PageInfo[]>([]);
  const [cropBox, setCropBox] = useState({ width: 300, height: 400, x: 50, y: 50 });
  const [applyToAll, setApplyToAll] = useState(true);
  
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelectClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setOriginalFile(file);
      processFile(file);
    } else if (file) {
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'Only PDF files are supported.' });
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      setOriginalFile(file);
      processFile(file);
    } else if (file) {
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'Only PDF files are supported for dropping.' });
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setProcessingMessage('Rendering PDF...');
    try {
      const fileBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: fileBuffer });
      const pdf = await loadingTask.promise;
      const infos: PageInfo[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error("Could not get canvas context");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport }).promise;

        infos.push({
          pageNumber: i,
          width: viewport.width,
          height: viewport.height,
          imageUrl: canvas.toDataURL(),
        });
      }
      
      setPageInfos(infos);

      if (infos.length > 0) {
        const firstPage = infos[0];
        setCropBox({
          width: firstPage.width * 0.8,
          height: firstPage.height * 0.8,
          x: firstPage.width * 0.1,
          y: firstPage.height * 0.1,
        });
      }

      setStep('crop');
      toast({ title: 'PDF Loaded', description: 'Adjust the box to crop your document.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error Loading PDF', description: 'The file may be corrupt or encrypted.' });
      handleStartOver();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCrop = async () => {
    if (!originalFile) return;

    setIsProcessing(true);
    setProcessingMessage('Cropping pages...');

    try {
      const pdfDoc = await PDFDocument.load(await originalFile.arrayBuffer());
      const pages = pdfDoc.getPages();
      
      const firstPageInfo = pageInfos[0];
      const scaleX = firstPageInfo.width / pages[0].getWidth();
      const scaleY = firstPageInfo.height / pages[0].getHeight();

      for (let i = 0; i < pages.length; i++) {
        if (applyToAll || i === 0) { // Apply to all or just the first page
           const page = pages[i];
           const { width, height } = page.getSize();
           
           // PDF coordinates start from bottom-left, UI coordinates from top-left.
           const newY = height - (cropBox.y / scaleY) - (cropBox.height / scaleY);
           
           page.setCropBox(
              cropBox.x / scaleX,
              newY,
              cropBox.width / scaleX,
              cropBox.height / scaleY
            );
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setOutputFile({ name: `${originalFile.name.replace('.pdf', '')}_cropped.pdf`, blob });
      setStep('download');
      toast({ title: 'Crop Successful', description: 'Your PDF has been cropped.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Cropping Failed', description: 'Could not apply the crop to the PDF.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setStep('upload');
    setOriginalFile(null);
    setOutputFile(null);
    pageInfos.forEach(p => URL.revokeObjectURL(p.imageUrl));
    setPageInfos([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGoBackToOptions = () => {
    setOutputFile(null);
    setStep('crop');
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
            <h1 className="text-3xl font-bold">Crop PDF</h1>
            <p className="text-muted-foreground mt-2">Easily trim the margins of your PDF pages to focus on the content that matters.</p>
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

    case 'crop':
      const firstPage = pageInfos[0];
      return (
        <div className="w-full max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Define Crop Area</h1>
            <p className="text-muted-foreground mt-2">Drag and resize the box on the first page. The crop will be applied to all pages.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-3/4">
               <Card>
                <CardContent className="p-4 flex justify-center items-start overflow-auto">
                  {firstPage && (
                    <div className="relative" style={{ width: firstPage.width, height: firstPage.height }}>
                      <img src={firstPage.imageUrl} alt="PDF page preview" width={firstPage.width} height={firstPage.height} />
                      <Rnd
                        bounds="parent"
                        size={{ width: cropBox.width, height: cropBox.height }}
                        position={{ x: cropBox.x, y: cropBox.y }}
                        onDragStop={(e, d) => setCropBox(prev => ({...prev, x: d.x, y: d.y}))}
                        onResizeStop={(e, dir, ref, delta, pos) => {
                          setCropBox({ width: parseFloat(ref.style.width), height: parseFloat(ref.style.height), ...pos });
                        }}
                        className="border-2 border-dashed border-primary bg-primary/20"
                      >
                         <div className="w-full h-full" />
                      </Rnd>
                    </div>
                  )}
                </CardContent>
               </Card>
            </div>
            <div className="w-full md:w-1/4 space-y-6">
                <Card>
                    <CardContent className="p-4 space-y-4">
                        <h3 className="font-semibold text-lg">Crop Settings</h3>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="apply-all" checked={applyToAll} onCheckedChange={c => setApplyToAll(c as boolean)} />
                            <Label htmlFor="apply-all">Apply to all {pageInfos.length} pages</Label>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Crop Dimensions</p>
                            <p className="text-xs text-muted-foreground">
                                W: {Math.round(cropBox.width)}px, H: {Math.round(cropBox.height)}px
                            </p>
                             <p className="text-xs text-muted-foreground">
                                X: {Math.round(cropBox.x)}px, Y: {Math.round(cropBox.y)}px
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Button onClick={handleStartOver} variant="outline" className="w-full">Back</Button>
                <Button onClick={handleCrop} size="lg" className="w-full">
                    <Crop className="mr-2 h-4 w-4" />
                    Crop PDF
                </Button>
            </div>
          </div>
        </div>
      );

    case 'download':
      return (
        <div className="w-full max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Process Complete!</h1>
            <p className="text-muted-foreground mt-2">Your cropped PDF is ready to download.</p>
          </div>
          <Card className="mb-8">
            <CardContent className="p-2">
              {outputFile && <iframe src={URL.createObjectURL(outputFile.blob)} className="w-full h-[70vh] border-0" title="Final PDF Preview" />}
            </CardContent>
          </Card>
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
        </div>
      );
  }
}
