'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Type, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Rnd } from 'react-rnd';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type EditStep = 'upload' | 'edit' | 'download';

type PageData = {
  imageUrl: string;
  width: number;
  height: number;
};

type EditableItem = {
  id: string;
  type: 'text';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: { r: number; g: number; b: number };
  isBold: boolean;
  isItalic: boolean;
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

export function EditPdfClient() {
  const [step, setStep] = useState<EditStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [pagesData, setPagesData] = useState<PageData[]>([]);
  const [editableItems, setEditableItems] = useState<EditableItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

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
    setProcessingMessage('Analyzing PDF...');
    
    try {
        const fileBuffer = await originalFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: fileBuffer.slice(0) }).promise;
        const processedPages: PageData[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          setProcessingMessage(`Processing page ${i} of ${pdf.numPages}...`);
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) throw new Error("Could not get canvas context");
          
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: context, viewport }).promise;

          processedPages.push({
            imageUrl: canvas.toDataURL('image/png'),
            width: viewport.width,
            height: viewport.height,
          });
        }
        
        setPagesData(processedPages);
        setStep('edit');
        toast({ title: 'PDF Loaded', description: 'Use the toolbar to add text or images.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not load the PDF for editing.' });
      handleStartOver();
    } finally {
      setIsProcessing(false);
    }
  };

  const addText = (pageIndex: number) => {
    const newText: EditableItem = {
      id: `text-${Date.now()}`,
      type: 'text',
      pageIndex,
      x: 50,
      y: 50,
      width: 200,
      height: 50,
      text: 'New Text',
      fontSize: 24,
      fontFamily: 'Helvetica',
      color: { r: 0, g: 0, b: 0 },
      isBold: false,
      isItalic: false,
    };
    setEditableItems([...editableItems, newText]);
    setSelectedItemId(newText.id);
  };

  const updateItem = (id: string, updates: Partial<EditableItem>) => {
    setEditableItems(items => items.map(item => item.id === id ? { ...item, ...updates } : item));
  };
  
  const deleteSelectedItem = () => {
    if(!selectedItemId) return;
    setEditableItems(items => items.filter(item => item.id !== selectedItemId));
    setSelectedItemId(null);
  }

  const getFont = async (pdfDoc: PDFDocument, fontFamily: string, isBold: boolean, isItalic: boolean): Promise<PDFFont> => {
      try {
        if (fontFamily.toLowerCase().includes('times')) {
            if (isBold && isItalic) return await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
            if (isBold) return await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
            if (isItalic) return await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
            return await pdfDoc.embedFont(StandardFonts.TimesRoman);
        } else if (fontFamily.toLowerCase().includes('courier')) {
            if (isBold && isItalic) return await pdfDoc.embedFont(StandardFonts.CourierBoldOblique);
            if (isBold) return await pdfDoc.embedFont(StandardFonts.CourierBold);
            if (isItalic) return await pdfDoc.embedFont(StandardFonts.CourierOblique);
            return await pdfDoc.embedFont(StandardFonts.Courier);
        } else { // Default to Helvetica
            if (isBold && isItalic) return await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
            if (isBold) return await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            if (isItalic) return await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
            return await pdfDoc.embedFont(StandardFonts.Helvetica);
        }
      } catch (e) {
        console.warn("Font embedding failed, falling back to Helvetica", e);
        return await pdfDoc.embedFont(StandardFonts.Helvetica);
      }
  }

  const handleDownload = async () => {
      setIsProcessing(true);
      setProcessingMessage("Generating PDF...");
      
      try {
        const originalPdfDoc = await PDFDocument.load(await originalFile!.arrayBuffer());
        
        for (const item of editableItems) {
            const page = originalPdfDoc.getPage(item.pageIndex);
            const { width, height } = page.getSize();
            const scale = width / pagesData[item.pageIndex].width;

            const font = await getFont(originalPdfDoc, item.fontFamily, item.isBold, item.isItalic);
            
            page.drawText(item.text, {
                x: item.x * scale,
                y: height - (item.y * scale) - (item.fontSize * scale), // adjust y from top-left to bottom-left
                font: font,
                size: item.fontSize * scale,
                color: rgb(item.color.r, item.color.g, item.color.b),
            });
        }
        
        const pdfBytes = await originalPdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${originalFile!.name.replace('.pdf', '')}_edited.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({ title: "Download Started", description: "Your edited PDF is being downloaded." });

      } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Failed to Generate PDF", description: "Could not save changes." });
      } finally {
        setIsProcessing(false);
      }
  };

  const handleStartOver = () => {
    setStep('upload');
    setOriginalFile(null);
    setPagesData([]);
    setEditableItems([]);
    setSelectedItemId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  if (isProcessing && step !== 'edit') {
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
            <p className="text-muted-foreground mt-2">Add text and images to your PDF documents.</p>
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
      const selectedItem = editableItems.find(item => item.id === selectedItemId);
      return (
        <div className="w-full">
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-20 bg-card p-2 rounded-lg shadow-lg border flex gap-2">
              <Button onClick={handleStartOver} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Start Over
              </Button>
              <Button onClick={handleDownload} size="lg" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {isProcessing ? processingMessage : 'Download Edited PDF'}
              </Button>
              {selectedItemId && (
                 <Button onClick={deleteSelectedItem} variant="destructive">
                   <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                 </Button>
              )}
          </div>

          {selectedItem && selectedItem.type === 'text' && (
            <div className="fixed top-32 left-1/2 -translate-x-1/2 z-20 bg-card p-3 rounded-lg shadow-lg border flex items-center gap-2">
               <input 
                 type="text"
                 value={selectedItem.text}
                 onChange={e => updateItem(selectedItem.id, { text: e.target.value })}
                 className="bg-transparent border-b"
               />
               <input 
                 type="number"
                 value={selectedItem.fontSize}
                 onChange={e => updateItem(selectedItem.id, { fontSize: parseInt(e.target.value, 10) || 12 })}
                 className="w-16"
               />
               <input
                type="color"
                value={`#${Object.values(selectedItem.color).map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`}
                onChange={e => updateItem(selectedItem.id, { color: hexToRgb(e.target.value) })}
               />
            </div>
          )}

            <div className="max-w-5xl mx-auto pt-32">
              <ScrollArea className="h-[calc(100vh-200px)] border rounded-lg bg-secondary/50">
                <div className="p-4 sm:p-8 space-y-8 flex flex-col items-center">
                  {pagesData.map((page, pageIndex) => (
                      <div 
                        key={`editable-page-${pageIndex}`}
                        className="relative shadow-lg bg-white"
                        style={{ width: page.width, height: page.height, flexShrink: 0 }}
                        onClick={() => setSelectedItemId(null)}
                      >
                        <img src={page.imageUrl} alt={`Page ${pageIndex+1}`} width={page.width} height={page.height} />
                        <div className="absolute top-2 right-2 z-10 flex gap-2">
                           <Button size="sm" onClick={(e) => { e.stopPropagation(); addText(pageIndex); }}> <Type className="mr-2 h-4 w-4"/> Add Text</Button>
                        </div>
                        {editableItems.filter(item => item.pageIndex === pageIndex).map(item => (
                            <Rnd
                                key={item.id}
                                size={{ width: item.width, height: item.height }}
                                position={{ x: item.x, y: item.y }}
                                onDragStop={(e, d) => {
                                    updateItem(item.id, { x: d.x, y: d.y });
                                }}
                                onResizeStop={(e, direction, ref, delta, position) => {
                                    updateItem(item.id, {
                                        width: parseInt(ref.style.width),
                                        height: parseInt(ref.style.height),
                                        ...position,
                                    });
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItemId(item.id);
                                }}
                                className={selectedItemId === item.id ? 'border-2 border-dashed border-blue-500 z-10' : 'border-2 border-dashed border-transparent hover:border-gray-400 z-10'}
                            >
                                <div
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    fontFamily: item.fontFamily,
                                    fontSize: `${item.fontSize}px`,
                                    color: `rgb(${item.color.r * 255}, ${item.color.g * 255}, ${item.color.b * 255})`,
                                    fontWeight: item.isBold ? 'bold' : 'normal',
                                    fontStyle: item.isItalic ? 'italic' : 'normal',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'move',
                                    whiteSpace: 'pre-wrap', // To allow text wrapping
                                    overflow: 'hidden'
                                  }}
                                >
                                  {item.text}
                                </div>
                            </Rnd>
                        ))}
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
        </div>
      );
    
    default:
        return null;
  }
}
