'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument, rgb, StandardFonts, PDFFont, degrees, pdfDocEncoding } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Type, Image as ImageIcon, Trash2, ArrowLeft, Bold, Italic, Underline, Strikethrough, Pilcrow } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Rnd } from 'react-rnd';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';


pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type EditStep = 'upload' | 'edit' | 'download';

type PageData = {
  imageUrl: string;
  width: number;
  height: number;
  originalPage: any; // pdfjs page object
};

type EditableItemBase = {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

type TextItem = EditableItemBase & {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  color: { r: number; g: number; b: number };
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
};

type ImageItem = EditableItemBase & {
  type: 'image';
  imageUrl: string;
  imageBytes: ArrayBuffer;
  mimeType: string;
};

type EditableItem = TextItem | ImageItem;

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

const rgbToHex = (r: number, g: number, b: number) => {
  const toHex = (c: number) => Math.round(c * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const fonts = [
    { name: "Helvetica", value: StandardFonts.Helvetica },
    { name: "Times Roman", value: StandardFonts.TimesRoman },
    { name: "Courier", value: StandardFonts.Courier },
]

export function EditPdfClient() {
  const [step, setStep] = useState<EditStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [pagesData, setPagesData] = useState<PageData[]>([]);
  const [editableItems, setEditableItems] = useState<EditableItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

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
            originalPage: page,
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

  const addItem = (type: 'text' | 'image', pageIndex: number, data?: any) => {
    const newItem: EditableItem =
      type === 'text'
        ? {
            id: `text-${Date.now()}`,
            type: 'text',
            pageIndex,
            x: 50,
            y: 50,
            width: 200,
            height: 40,
            rotation: 0,
            text: 'New Text',
            fontSize: 24,
            fontFamily: StandardFonts.Helvetica,
            color: { r: 0, g: 0, b: 0 },
            isBold: false,
            isItalic: false,
            isUnderline: false,
            isStrikethrough: false,
          }
        : {
            id: `image-${Date.now()}`,
            type: 'image',
            pageIndex,
            x: 50,
            y: 50,
            width: 200,
            height: 150,
            rotation: 0,
            ...data,
          };
    setEditableItems(prev => [...prev, newItem]);
    setSelectedItemId(newItem.id);
  };
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, pageIndex: number) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select an image file.' });
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        const imageBytes = reader.result as ArrayBuffer;
        addItem('image', pageIndex, { imageUrl, imageBytes, mimeType: file.type });
    };
    reader.readAsArrayBuffer(file);
    // Reset file input
    if (imageInputRef.current) imageInputRef.current.value = '';
  }

  const updateItem = (id: string, updates: Partial<EditableItem>) => {
    setEditableItems(items => items.map(item => item.id === id ? { ...item, ...updates } : item));
  };
  
  const deleteSelectedItem = () => {
    if(!selectedItemId) return;
    setEditableItems(items => items.filter(item => item.id !== selectedItemId));
    setSelectedItemId(null);
  };

  const getFont = async (pdfDoc: PDFDocument, item: TextItem): Promise<PDFFont> => {
      let font = item.fontFamily;
      // pdf-lib doesn't have a generic "get font" so we map it.
      if (font === StandardFonts.TimesRoman) {
          if (item.isBold && item.isItalic) return pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
          if (item.isBold) return pdfDoc.embedFont(StandardFonts.TimesRomanBold);
          if (item.isItalic) return pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
          return pdfDoc.embedFont(StandardFonts.TimesRoman);
      }
      if (font === StandardFonts.Courier) {
          if (item.isBold && item.isItalic) return pdfDoc.embedFont(StandardFonts.CourierBoldOblique);
          if (item.isBold) return pdfDoc.embedFont(StandardFonts.CourierBold);
          if (item.isItalic) return pdfDoc.embedFont(StandardFonts.CourierOblique);
          return pdfDoc.embedFont(StandardFonts.Courier);
      }
      // Default to Helvetica
      if (item.isBold && item.isItalic) return pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
      if (item.isBold) return pdfDoc.embedFont(StandardFonts.HelveticaBold);
      if (item.isItalic) return pdfDoc.embedFont(StandardFonts.HelveticaOblique);
      return pdfDoc.embedFont(StandardFonts.Helvetica);
  };
  
  const handleDownload = async () => {
      setIsProcessing(true);
      setProcessingMessage("Generating PDF...");
      
      try {
        const newPdfDoc = await PDFDocument.create();
        
        for (let i = 0; i < pagesData.length; i++) {
          const pageData = pagesData[i];
          const [copiedPage] = await newPdfDoc.copyPages(await PDFDocument.load(await pageData.originalPage.render({ canvasContext: document.createElement('canvas').getContext('2d'), viewport: pageData.originalPage.getViewport({ scale: 1.0 }) }).promise.then(() => (pageData.originalPage as any).pdfManager.getData()), { ignoreEncryption: true }), [0]);
          
          // A bit of a hacky way to get the original page into the new doc
          const { width, height } = pageData.originalPage.getViewport({ scale: 1.0 });
          const newPage = newPdfDoc.addPage([width, height]);
          const origPdf = await PDFDocument.load(await originalFile!.arrayBuffer());
          const [embeddedPage] = await newPdfDoc.embedPdf(origPdf, [i]);
          newPage.drawPdf(embeddedPage, { x: 0, y: 0, width, height });


          const itemsOnPage = editableItems.filter(item => item.pageIndex === i);
          
          for (const item of itemsOnPage) {
            const scale = width / pageData.width;

            if (item.type === 'text') {
              const font = await getFont(newPdfDoc, item);
              const textWidth = font.widthOfTextAtSize(item.text, item.fontSize * scale);
              
              newPage.drawText(item.text, {
                  x: item.x * scale,
                  y: height - (item.y * scale) - (item.fontSize * scale),
                  font,
                  size: item.fontSize * scale,
                  color: rgb(item.color.r, item.color.g, item.color.b),
                  lineHeight: item.fontSize * scale * 1.2,
                  rotate: degrees(-item.rotation),
                  wordBreaks: [...item.text.split(''), ...pdfDocEncoding.symbols],
              });
              
            } else if (item.type === 'image') {
               let embeddedImage;
               if (item.mimeType === 'image/png') {
                    embeddedImage = await newPdfDoc.embedPng(item.imageBytes);
               } else {
                    embeddedImage = await newPdfDoc.embedJpg(item.imageBytes);
               }
               newPage.drawImage(embeddedImage, {
                    x: item.x * scale,
                    y: height - (item.y * scale) - (item.height * scale),
                    width: item.width * scale,
                    height: item.height * scale,
                    rotate: degrees(-item.rotation),
               });
            }
          }
        }
        
        const pdfBytes = await newPdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        setOutputFile({ name: `${originalFile!.name.replace('.pdf', '')}_edited.pdf`, blob });
        setStep('download');

        toast({ title: "PDF Generated", description: "Your edited PDF is ready for preview." });

      } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Failed to Generate PDF", description: "Could not save changes." });
      } finally {
        setIsProcessing(false);
      }
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


  const handleStartOver = () => {
    setStep('upload');
    setOriginalFile(null);
    pagesData.forEach(p => URL.revokeObjectURL(p.imageUrl));
    setPagesData([]);
    setEditableItems([]);
    setSelectedItemId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (outputFile) URL.revokeObjectURL(URL.createObjectURL(outputFile.blob));
    setOutputFile(null);
  };
  
  const handleGoBackToEditor = () => {
    setOutputFile(null);
    setStep('edit');
  };
  
  const renderTextToolbar = () => {
    const item = editableItems.find(i => i.id === selectedItemId) as TextItem;
    if (!item) return null;
    
    return (
       <div className="fixed top-24 left-1/2 -translate-x-1/2 z-20 bg-card p-2 rounded-lg shadow-lg border flex items-center gap-2 flex-wrap justify-center">
            <Input 
                type="text"
                value={item.text}
                onChange={e => updateItem(item.id, { text: e.target.value })}
                className="bg-transparent border-b w-40 h-8"
                onFocus={(e) => e.target.select()}
            />
            <Select
                value={item.fontFamily}
                onValueChange={value => updateItem(item.id, { fontFamily: value })}
            >
                <SelectTrigger className="w-32 h-8">
                    <SelectValue placeholder="Font" />
                </SelectTrigger>
                <SelectContent>
                    {fonts.map(f => (
                        <SelectItem key={f.value} value={f.value} style={{fontFamily: f.name}}>
                            {f.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Input 
                type="number"
                value={item.fontSize}
                onChange={e => updateItem(item.id, { fontSize: parseInt(e.target.value, 10) || 12 })}
                className="w-20 h-8"
            />
            <Input
                type="color"
                value={rgbToHex(item.color.r, item.color.g, item.color.b)}
                onChange={e => updateItem(item.id, { color: hexToRgb(e.target.value) })}
                className="h-8 w-10 p-1"
            />
            <ToggleGroup 
                type="multiple"
                variant="outline"
                size="sm"
                value={[
                    ...(item.isBold ? ['bold'] : []),
                    ...(item.isItalic ? ['italic'] : []),
                    ...(item.isUnderline ? ['underline'] : []),
                    ...(item.isStrikethrough ? ['strikethrough'] : []),
                ]}
                onValueChange={(value) => {
                    updateItem(item.id, {
                        isBold: value.includes('bold'),
                        isItalic: value.includes('italic'),
                        isUnderline: value.includes('underline'),
                        isStrikethrough: value.includes('strikethrough')
                    });
                }}
            >
                <ToggleGroupItem value="bold" aria-label="Toggle bold"><Bold className="h-4 w-4" /></ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="Toggle italic"><Italic className="h-4 w-4" /></ToggleGroupItem>
                <ToggleGroupItem value="underline" aria-label="Toggle underline"><Underline className="h-4 w-4" /></ToggleGroupItem>
                <ToggleGroupItem value="strikethrough" aria-label="Toggle strikethrough"><Strikethrough className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>
       </div>
    )
  }
  
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
            <p className="text-muted-foreground mt-2">Add text, images, and shapes to your PDF document.</p>
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
          {/* Main Toolbar */}
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 bg-card p-2 rounded-lg shadow-lg border flex gap-2">
              <Button onClick={handleStartOver} variant="outline">
                Start Over
              </Button>
              <Button onClick={handleDownload} size="lg" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {isProcessing ? processingMessage : 'Apply & Download'}
              </Button>
              {selectedItemId && (
                 <Button onClick={deleteSelectedItem} variant="destructive" size="icon">
                   <Trash2 className="h-4 w-4" />
                 </Button>
              )}
          </div>
          {/* Contextual Toolbar */}
          {selectedItem?.type === 'text' && renderTextToolbar()}

            <div className="max-w-7xl mx-auto pt-40" onClick={() => setSelectedItemId(null)}>
              <ScrollArea className="h-[calc(100vh-220px)] border rounded-lg bg-secondary/50">
                <div className="p-4 sm:p-8 space-y-8 flex flex-col items-center">
                  {pagesData.map((page, pageIndex) => (
                      <div 
                        key={`editable-page-${pageIndex}`}
                        className="relative shadow-lg bg-white"
                        style={{ width: page.width, height: page.height, flexShrink: 0 }}
                        // Deselect items when clicking on page background
                        onClick={(e) => { e.stopPropagation(); setSelectedItemId(null); }}
                      >
                        <img src={page.imageUrl} alt={`Page ${pageIndex+1}`} width={page.width} height={page.height} className="pointer-events-none" />
                        
                        {/* Add buttons for this page */}
                        <div className="absolute top-2 right-2 z-10 flex gap-2">
                           <Button size="sm" onClick={(e) => { e.stopPropagation(); addItem('text', pageIndex); }}> <Type className="mr-2 h-4 w-4"/> Add Text</Button>
                           <input type="file" ref={imageInputRef} onChange={(e) => handleImageUpload(e, pageIndex)} className="hidden" accept="image/*" />
                           <Button size="sm" onClick={(e) => { e.stopPropagation(); imageInputRef.current?.click();}}> <ImageIcon className="mr-2 h-4 w-4"/> Add Image</Button>
                        </div>
                        
                        {/* Render editable items */}
                        {editableItems.filter(item => item.pageIndex === pageIndex).map(item => {
                          if (item.type === 'text') {
                            return (
                                <Rnd
                                    key={item.id}
                                    size={{ width: item.width, height: item.height }}
                                    position={{ x: item.x, y: item.y }}
                                    onDragStop={(e, d) => updateItem(item.id, { x: d.x, y: d.y })}
                                    onResizeStop={(e, dir, ref, delta, pos) => updateItem(item.id, { width: parseInt(ref.style.width), height: parseInt(ref.style.height), ...pos })}
                                    onClick={(e) => { e.stopPropagation(); setSelectedItemId(item.id); }}
                                    className={cn('border-2 border-dashed z-10', selectedItemId === item.id ? 'border-blue-500' : 'border-transparent hover:border-gray-400')}
                                    minWidth={50}
                                    minHeight={20}
                                >
                                    <div
                                      style={{
                                        fontFamily: item.fontFamily,
                                        fontSize: `${item.fontSize}px`,
                                        color: `rgb(${item.color.r * 255}, ${item.color.g * 255}, ${item.color.b * 255})`,
                                        fontWeight: item.isBold ? 'bold' : 'normal',
                                        fontStyle: item.isItalic ? 'italic' : 'normal',
                                        textDecoration: `${item.isUnderline ? 'underline' : ''} ${item.isStrikethrough ? 'line-through' : ''}`.trim(),
                                        width: '100%',
                                        height: '100%',
                                        overflow: 'hidden',
                                        cursor: 'move',
                                      }}
                                    >
                                      {item.text}
                                    </div>
                                </Rnd>
                            );
                          }
                           if (item.type === 'image') {
                            return (
                                <Rnd
                                    key={item.id}
                                    size={{ width: item.width, height: item.height }}
                                    position={{ x: item.x, y: item.y }}
                                    onDragStop={(e, d) => updateItem(item.id, { x: d.x, y: d.y })}
                                    onResizeStop={(e, dir, ref, delta, pos) => updateItem(item.id, { width: parseInt(ref.style.width), height: parseInt(ref.style.height), ...pos })}
                                    onClick={(e) => { e.stopPropagation(); setSelectedItemId(item.id); }}
                                    className={cn('border-2 border-dashed z-10', selectedItemId === item.id ? 'border-blue-500' : 'border-transparent hover:border-gray-400')}
                                    lockAspectRatio
                                >
                                    <img src={item.imageUrl} alt="user content" style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />
                                </Rnd>
                            );
                          }
                          return null;
                        })}
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
        </div>
      );
    
    case 'download':
        return (
            <div className="w-full max-w-4xl mx-auto text-center">
                 <div className="mb-8">
                    <h1 className="text-3xl font-bold">Preview Your Edited PDF</h1>
                    <p className="text-muted-foreground mt-2">Your document is ready. Download it or go back to make more changes.</p>
                </div>
                <div className="flex justify-center gap-4">
                     <Button onClick={handleGoBackToEditor} variant="outline">
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
                        <iframe src={URL.createObjectURL(outputFile!.blob)} className="w-full h-[70vh] border-0" title="Final PDF Preview" />
                    </CardContent>
                </Card>
            </div>
        )
    default:
        return null;
  }
}
