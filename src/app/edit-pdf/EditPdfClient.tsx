'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Type, Image as ImageIcon, Wand2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Rnd } from 'react-rnd';

type EditStep = 'upload' | 'edit' | 'download';

type OverlayItem = {
  id: number;
  type: 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
} | {
  id: number;
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  imageBytes: ArrayBuffer;
  fileType: 'png' | 'jpeg';
};

export function EditPdfClient() {
  const [step, setStep] = useState<EditStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [pageImageUrl, setPageImageUrl] = useState<string | null>(null);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });

  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<number | null>(null);
  
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
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
        const pdfDoc = await PDFDocument.load(fileBuffer);
        const page = pdfDoc.getPage(0); // For simplicity, editing the first page.
        const { width, height } = page.getSize();

        // This is a bit of a trick: render the original page to an image to use as a background
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        const pdf = await pdfjsLib.getDocument({ data: fileBuffer.slice(0) }).promise;
        const canvasPage = await pdf.getPage(1);
        const viewport = canvasPage.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        if(!context) throw new Error('Canvas context not available');
        await canvasPage.render({ canvasContext: context, viewport }).promise;
        setPageImageUrl(canvas.toDataURL('image/png'));

        setPageDimensions({ width: viewport.width, height: viewport.height });

        setStep('edit');
        toast({ title: 'PDF Loaded', description: 'You can now add text or images to the first page.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not load the PDF for editing.' });
      handleStartOver();
    } finally {
      setIsProcessing(false);
    }
  };


  const addText = () => {
    const newText: OverlayItem = {
      id: Date.now(),
      type: 'text',
      x: 50,
      y: 50,
      width: 150,
      height: 30,
      text: 'New Text',
      fontSize: 16
    };
    setOverlays(prev => [...prev, newText]);
  };

  const addImage = () => {
    imageInputRef.current?.click();
  };
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const imageBytes = e.target?.result as ArrayBuffer;
        if (!imageBytes) return;

        const newImage: OverlayItem = {
            id: Date.now(),
            type: 'image',
            x: 100,
            y: 100,
            width: 200,
            height: 150,
            imageBytes,
            fileType: file.type === 'image/png' ? 'png' : 'jpeg'
        };
        setOverlays(prev => [...prev, newImage]);
    };
    reader.readAsArrayBuffer(file);
  };
  
  const updateOverlay = (id: number, changes: Partial<OverlayItem>) => {
    setOverlays(prev => prev.map(o => o.id === id ? { ...o, ...changes } : o));
  };


  const handleApplyEdits = async () => {
      if (overlays.length === 0) {
        toast({ title: 'No Edits Made', description: 'Add text or images before applying changes.' });
        return;
      }
      
      setIsProcessing(true);
      setProcessingMessage("Applying changes...");
      
      try {
        const pdfDoc = await PDFDocument.load(await originalFile!.arrayBuffer());
        const page = pdfDoc.getPage(0);
        const { width: pdfPageWidth, height: pdfPageHeight } = page.getSize();
        
        const scaleX = pdfPageWidth / pageDimensions.width;
        const scaleY = pdfPageHeight / pageDimensions.height;

        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        for (const overlay of overlays) {
            if (overlay.type === 'text') {
                page.drawText(overlay.text, {
                    x: overlay.x * scaleX,
                    y: pdfPageHeight - ((overlay.y + overlay.fontSize) * scaleY), // Adjusted for proper text alignment from top-left
                    font: helveticaFont,
                    size: overlay.fontSize * scaleX,
                    color: rgb(0, 0, 0),
                    lineHeight: overlay.fontSize * 1.2 * scaleY,
                    maxWidth: overlay.width * scaleX,
                });
            } else if (overlay.type === 'image') {
                const image = overlay.fileType === 'png' 
                    ? await pdfDoc.embedPng(overlay.imageBytes)
                    : await pdfDoc.embedJpg(overlay.imageBytes);

                page.drawImage(image, {
                    x: overlay.x * scaleX,
                    y: pdfPageHeight - ((overlay.y + overlay.height) * scaleY),
                    width: overlay.width * scaleX,
                    height: overlay.height * scaleY,
                });
            }
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
    if(pageImageUrl) URL.revokeObjectURL(pageImageUrl);
    setPageImageUrl(null);
    setPageDimensions({ width: 0, height: 0 });
    setOverlays([]);
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
            <h1 className="text-3xl font-bold">Edit PDF</h1>
            <p className="text-muted-foreground mt-2">Add new text and images to your PDF. For now, editing is limited to the first page.</p>
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
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold">Edit Your Document</h1>
            <p className="text-muted-foreground mt-2">Add new elements and drag them into position.</p>
          </div>
          
           <div className="flex flex-col sm:flex-row justify-center items-center gap-4 my-4 p-4 bg-card border rounded-lg shadow-sm sticky top-0 z-10">
              <Button onClick={handleStartOver} variant="outline">Start Over</Button>
              <div className="flex items-center gap-2">
                 <Button onClick={addText}><Type className="mr-2 h-4 w-4" /> Add Text</Button>
                 <Button onClick={addImage}><ImageIcon className="mr-2 h-4 w-4" /> Add Image</Button>
                  <input
                    type="file"
                    ref={imageInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    accept="image/png, image/jpeg"
                />
              </div>
              <Button onClick={handleApplyEdits} size="lg" disabled={overlays.length === 0}>
                <Wand2 className="mr-2 h-4 w-4" />
                Apply Changes
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-2 flex justify-center items-start overflow-auto">
                 <div 
                    className="relative shadow-lg"
                    style={{ width: pageDimensions.width, height: pageDimensions.height, flexShrink: 0 }}
                    onClick={() => setSelectedOverlay(null)}
                 >
                    {pageImageUrl && <img src={pageImageUrl} alt="PDF page background" className="absolute top-0 left-0 w-full h-full select-none" draggable={false} />}
                    {overlays.map((overlay) => (
                        <Rnd
                          key={overlay.id}
                          size={{ width: overlay.width, height: overlay.height }}
                          position={{ x: overlay.x, y: overlay.y }}
                          onDragStop={(e, d) => {
                            e.stopPropagation();
                            updateOverlay(overlay.id, { x: d.x, y: d.y })
                          }}
                          onResizeStop={(e, direction, ref, delta, position) => {
                            e.stopPropagation();
                            updateOverlay(overlay.id, {
                              width: parseInt(ref.style.width, 10),
                              height: parseInt(ref.style.height, 10),
                              ...position,
                            });
                          }}
                          onClick={(e) => {
                             e.stopPropagation();
                             setSelectedOverlay(overlay.id);
                          }}
                          className={cn(
                            'border border-dashed flex items-center justify-center',
                            selectedOverlay === overlay.id ? 'border-primary' : 'border-transparent hover:border-primary/50'
                          )}
                          cancel=".non-draggable"
                        >
                            {overlay.type === 'text' ? (
                                <textarea
                                    value={overlay.text}
                                    onChange={(e) => updateOverlay(overlay.id, { text: e.target.value })}
                                    style={{ fontSize: overlay.fontSize, lineHeight: '1.2' }}
                                    className="non-draggable w-full h-full bg-transparent resize-none focus:outline-none p-1"
                                />
                            ) : (
                                <img src={URL.createObjectURL(new Blob([overlay.imageBytes]))} alt="user content" className="w-full h-full object-cover" />
                            )}
                        </Rnd>
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
