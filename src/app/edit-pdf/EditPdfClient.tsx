'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Wand2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type EditStep = 'upload' | 'edit' | 'download';

type TextItem = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  originalText: string;
  fontFamily: string;
  fontSize: number;
  transform: number[];
};

export function EditPdfClient() {
  const [step, setStep] = useState<EditStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [pageImageUrl, setPageImageUrl] = useState<string | null>(null);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0, scale: 1 });
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
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
    setProcessingMessage('Analyzing PDF text...');
    
    try {
        const fileBuffer = await originalFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: fileBuffer.slice(0) }).promise;
        const page = await pdf.getPage(1); // For now, editing the first page.
        
        const scale = 2.0;
        const viewport = page.getViewport({ scale });

        // Render page to canvas for background image
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        if(!context) throw new Error('Canvas context not available');
        await page.render({ canvasContext: context, viewport }).promise;
        setPageImageUrl(canvas.toDataURL('image/png'));
        setPageDimensions({ width: viewport.width, height: viewport.height, scale });
        
        // Extract text items and their properties
        const textContent = await page.getTextContent();
        const extractedTextItems: TextItem[] = textContent.items.map((item: any, index) => {
            const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
            const fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
            
            return {
                id: `text-${Date.now()}-${index}`,
                text: item.str,
                originalText: item.str,
                x: tx[4],
                y: tx[5] - fontHeight,
                width: item.width,
                height: item.height,
                fontSize: fontHeight,
                fontFamily: item.fontName,
                transform: item.transform,
            };
        });

        setTextItems(extractedTextItems);
        setStep('edit');
        toast({ title: 'PDF Loaded', description: 'Click on a text block to edit it.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not load the PDF for editing.' });
      handleStartOver();
    } finally {
      setIsProcessing(false);
    }
  };

  const updateTextItem = (id: string, newText: string) => {
    setTextItems(prev => prev.map(item => item.id === id ? { ...item, text: newText } : item));
  };


  const handleApplyEdits = async () => {
      const editedItems = textItems.filter(item => item.text !== item.originalText);
      if (editedItems.length === 0) {
        toast({ title: 'No Edits Made', description: 'Change some text before applying edits.' });
        return;
      }
      
      setIsProcessing(true);
      setProcessingMessage("Applying changes...");
      
      try {
        const pdfDoc = await PDFDocument.load(await originalFile!.arrayBuffer());
        const page = pdfDoc.getPage(0);
        const { width: pdfPageWidth, height: pdfPageHeight } = page.getSize();
        
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        for (const item of editedItems) {
            const pdf_x = item.x / pageDimensions.scale;
            const pdf_y = pdfPageHeight - (item.y / pageDimensions.scale) - (item.fontSize / pageDimensions.scale);
            const pdf_width = item.width / pageDimensions.scale;
            const pdf_height = item.height / pageDimensions.scale;
            const pdf_fontSize = item.fontSize / pageDimensions.scale;
            
            // Draw a white rectangle to cover the old text
            page.drawRectangle({
                x: pdf_x,
                y: pdf_y - (pdf_height * 0.2), // Adjust for baseline
                width: pdf_width,
                height: pdf_height * 1.2,
                color: rgb(1, 1, 1),
            });
            
            // Draw the new text
            page.drawText(item.text, {
                x: pdf_x,
                y: pdf_y,
                font: helveticaFont, // Using a standard font for simplicity
                size: pdf_fontSize,
                color: rgb(0, 0, 0),
            });
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
    setPageDimensions({ width: 0, height: 0, scale: 1 });
    setTextItems([]);
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
            <p className="text-muted-foreground mt-2">Click on existing text to replace it. Editing is currently supported for the first page only.</p>
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
            <p className="text-muted-foreground mt-2">Click on the text you want to change and type your replacement.</p>
          </div>
          
           <div className="flex flex-col sm:flex-row justify-center items-center gap-4 my-4 p-4 bg-card border rounded-lg shadow-sm sticky top-0 z-10">
              <Button onClick={handleStartOver} variant="outline">Start Over</Button>
              <Button onClick={handleApplyEdits} size="lg">
                <Wand2 className="mr-2 h-4 w-4" />
                Apply Changes
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-2 flex justify-center items-start overflow-auto">
                 <div 
                    className="relative shadow-lg"
                    style={{ width: pageDimensions.width, height: pageDimensions.height, flexShrink: 0 }}
                 >
                    {pageImageUrl && <img src={pageImageUrl} alt="PDF page background" className="absolute top-0 left-0 w-full h-full select-none" draggable={false} />}
                    {textItems.map((item) => (
                        <textarea
                            key={item.id}
                            value={item.text}
                            onChange={(e) => updateTextItem(item.id, e.target.value)}
                            className="absolute bg-transparent text-transparent caret-black resize-none p-0 m-0 border border-transparent hover:border-blue-400 focus:border-blue-600 focus:outline-none"
                            style={{
                                left: `${item.x}px`,
                                top: `${item.y}px`,
                                width: `${item.width}px`,
                                height: `${item.height * 1.2}px`, // Add some extra height for multiline editing
                                fontSize: `${item.fontSize}px`,
                                fontFamily: item.fontFamily.includes('Bold') ? 'Helvetica-Bold' : 'Helvetica', // Simple font mapping
                                lineHeight: 1,
                            }}
                        />
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
