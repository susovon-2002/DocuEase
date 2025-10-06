'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Wand2, ArrowLeft, Edit, Bold, Italic, Palette, Highlighter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type EditStep = 'upload' | 'edit' | 'download';

type PageData = {
  imageUrl: string;
  dimensions: { width: number; height: number; scale: number; };
  textItems: TextItem[];
}

type TextItem = {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  originalText: string;
  fontFamily: string;
  fontSize: number;
  transform: number[];
  color: { r: number, g: number, b: number };
  isBold: boolean;
  isItalic: boolean;
  highlightColor: { r: number, g: number, b: number, a: number } | null;
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

const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + [r, g, b].map(x => {
    const hex = Math.round(x * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

export function EditPdfClient() {
  const [step, setStep] = useState<EditStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [pagesData, setPagesData] = useState<PageData[]>([]);
  
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<TextItem | null>(null);
  const [editedText, setEditedText] = useState('');
  const [editedStyle, setEditedStyle] = useState({
      fontSize: 12,
      fontFamily: 'Helvetica',
      isBold: false,
      isItalic: false,
      color: { r: 0, g: 0, b: 0 },
      highlightColor: null as { r: number, g: number, b: number, a: number } | null
  });

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
          
          const scale = 2.0;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext('2d');
          if(!context) throw new Error('Canvas context not available');
          await page.render({ canvasContext: context, viewport }).promise;
          const imageUrl = canvas.toDataURL('image/png');
          
          const textContent = await page.getTextContent();
          
          const extractedTextItems: TextItem[] = textContent.items.map((item: any, index) => {
              const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
              
              const fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
              const angle = Math.atan2(tx[1], tx[0]);

              let width = item.width * viewport.scale;
              if (Math.abs(angle) > 0.01) {
                width = item.width * viewport.scale;
              }

              return {
                  id: `text-p${i}-${Date.now()}-${index}`,
                  pageIndex: i - 1,
                  text: item.str,
                  originalText: item.str,
                  x: tx[4],
                  y: tx[5] - fontHeight,
                  width: width,
                  height: item.height * viewport.scale,
                  fontSize: fontHeight,
                  fontFamily: item.fontName.includes('Bold') ? item.fontName.replace('Bold','') : item.fontName,
                  transform: item.transform,
                  isBold: item.fontName.includes('Bold'),
                  isItalic: item.fontName.includes('Italic'),
                  color: { r: 0, g: 0, b: 0}, // pdf.js does not reliably provide color
                  highlightColor: null,
              };
          });

          processedPages.push({
            imageUrl,
            dimensions: { width: viewport.width, height: viewport.height, scale },
            textItems: extractedTextItems
          });
        }
        
        setPagesData(processedPages);
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

  const openEditDialog = (item: TextItem) => {
    setCurrentItem(item);
    setEditedText(item.text);
    setEditedStyle({
      fontFamily: item.fontFamily.replace('g_d0_f', 'Helvetica'), // default mapping
      fontSize: item.fontSize,
      isBold: item.isBold,
      isItalic: item.isItalic,
      color: item.color,
      highlightColor: item.highlightColor
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveTextChange = () => {
    if (!currentItem) return;

    const newPagesData = [...pagesData];
    const pageData = newPagesData[currentItem.pageIndex];
    const itemIndex = pageData.textItems.findIndex(item => item.id === currentItem.id);
    
    if (itemIndex > -1) {
        pageData.textItems[itemIndex] = { 
            ...pageData.textItems[itemIndex], 
            text: editedText,
            ...editedStyle,
        };
        setPagesData(newPagesData);
    }

    setIsEditDialogOpen(false);
    setCurrentItem(null);
    toast({ title: 'Text Updated', description: 'Your change has been staged. Apply all changes to finalize.'});
  };

  const getFont = async (pdfDoc: PDFDocument, fontFamily: string, isBold: boolean, isItalic: boolean): Promise<PDFFont> => {
      let fontEnum: StandardFonts = StandardFonts.Helvetica;

      if (fontFamily.toLowerCase().includes('times')) {
          if (isBold && isItalic) fontEnum = StandardFonts.TimesRomanBoldItalic;
          else if (isBold) fontEnum = StandardFonts.TimesRomanBold;
          else if (isItalic) fontEnum = StandardFonts.TimesRomanItalic;
          else fontEnum = StandardFonts.TimesRoman;
      } else if (fontFamily.toLowerCase().includes('courier')) {
          if (isBold && isItalic) fontEnum = StandardFonts.CourierBoldOblique;
          else if (isBold) fontEnum = StandardFonts.CourierBold;
          else if (isItalic) fontEnum = StandardFonts.CourierOblique;
          else fontEnum = StandardFonts.Courier;
      } else { // Default to Helvetica
          if (isBold && isItalic) fontEnum = StandardFonts.HelveticaBoldOblique;
          else if (isBold) fontEnum = StandardFonts.HelveticaBold;
          else if (isItalic) fontEnum = StandardFonts.HelveticaOblique;
          else fontEnum = StandardFonts.Helvetica;
      }
      return await pdfDoc.embedFont(fontEnum);
  }

  const handleApplyEdits = async () => {
      const editedItems = pagesData.flatMap(p => p.textItems).filter(item => 
        item.text !== item.originalText || item.highlightColor !== null || item.isBold || item.isItalic
      );

      if (editedItems.length === 0) {
        toast({ title: 'No Edits Made', description: 'Change some text before applying edits.' });
        return;
      }
      
      setIsProcessing(true);
      setProcessingMessage("Applying changes...");
      
      try {
        const pdfDoc = await PDFDocument.load(await originalFile!.arrayBuffer());
        
        for (const item of editedItems) {
            const page = pdfDoc.getPage(item.pageIndex);
            const { width: pdfPageWidth, height: pdfPageHeight } = page.getSize();
            const pageDimensions = pagesData[item.pageIndex].dimensions;
            
            const pdf_x = item.x / pageDimensions.scale;
            const pdf_y = pdfPageHeight - (item.y / pageDimensions.scale) - (item.fontSize / pageDimensions.scale);
            const pdf_width = item.width / pageDimensions.scale;
            const pdf_height = item.height / pageDimensions.scale;
            const pdf_fontSize = item.fontSize / pageDimensions.scale;
            
            // Erase original text
            page.drawRectangle({
                x: pdf_x - 2,
                y: pdf_y - (pdf_height * 0.2),
                width: pdf_width + 4,
                height: pdf_height * 1.4,
                color: rgb(1, 1, 1),
            });

             const font = await getFont(pdfDoc, item.fontFamily, item.isBold, item.isItalic);

            // Add highlight if exists
            if (item.highlightColor) {
                page.drawRectangle({
                    x: pdf_x,
                    y: pdf_y - (pdf_height * 0.2),
                    width: pdf_width,
                    height: pdf_height * 1.2,
                    color: rgb(item.highlightColor.r, item.highlightColor.g, item.highlightColor.b),
                    opacity: item.highlightColor.a,
                });
            }
            
            // Draw new text
            page.drawText(item.text, {
                x: pdf_x,
                y: pdf_y,
                font: font,
                size: pdf_fontSize,
                color: rgb(item.color.r, item.color.g, item.color.b),
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
    pagesData.forEach(p => URL.revokeObjectURL(p.imageUrl));
    setPagesData([]);
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
            <p className="text-muted-foreground mt-2">Click on existing text to replace it.</p>
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
           <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Text</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="p-2 rounded-md border bg-muted flex items-center gap-2">
                           <Button 
                             variant={editedStyle.isBold ? 'secondary' : 'ghost'} 
                             size="icon" 
                             onClick={() => setEditedStyle(s => ({...s, isBold: !s.isBold}))}
                           >
                               <Bold className="h-4 w-4" />
                           </Button>
                           <Button 
                             variant={editedStyle.isItalic ? 'secondary' : 'ghost'} 
                             size="icon"
                             onClick={() => setEditedStyle(s => ({...s, isItalic: !s.isItalic}))}
                           >
                               <Italic className="h-4 w-4" />
                           </Button>
                           <Separator orientation="vertical" className="h-6" />
                           <Select value={editedStyle.fontFamily} onValueChange={v => setEditedStyle(s => ({...s, fontFamily: v}))}>
                               <SelectTrigger className="w-[150px]">
                                   <SelectValue placeholder="Font" />
                               </SelectTrigger>
                               <SelectContent>
                                   <SelectItem value="Helvetica">Helvetica</SelectItem>
                                   <SelectItem value="Times-Roman">Times New Roman</SelectItem>
                                   <SelectItem value="Courier">Courier</SelectItem>
                               </SelectContent>
                           </Select>
                           <Input 
                             type="number" 
                             value={Math.round(editedStyle.fontSize)} 
                             onChange={e => setEditedStyle(s => ({...s, fontSize: parseInt(e.target.value, 10)}))}
                             className="w-[70px]"
                             min="1"
                           />
                           <Separator orientation="vertical" className="h-6" />

                           <Button variant="ghost" size="icon" className="relative">
                              <Palette className="h-4 w-4" />
                              <Input type="color" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                value={rgbToHex(editedStyle.color.r, editedStyle.color.g, editedStyle.color.b)}
                                onChange={e => setEditedStyle(s => ({...s, color: hexToRgb(e.target.value)}))}
                              />
                           </Button>
                           <Button variant="ghost" size="icon" className="relative">
                              <Highlighter className="h-4 w-4" />
                              <Input type="color" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                value={editedStyle.highlightColor ? rgbToHex(editedStyle.highlightColor.r, editedStyle.highlightColor.g, editedStyle.highlightColor.b) : '#ffffff'}
                                onChange={e => {
                                  const color = hexToRgb(e.target.value);
                                  if (e.target.value === '#ffffff') {
                                    setEditedStyle(s => ({...s, highlightColor: null}));
                                  } else {
                                    setEditedStyle(s => ({...s, highlightColor: {...color, a: 0.3}}));
                                  }
                                }}
                              />
                           </Button>

                        </div>

                        <div>
                            <Label htmlFor="replacement-text">Replacement Text</Label>
                            <Textarea
                                id="replacement-text"
                                value={editedText}
                                onChange={(e) => setEditedText(e.target.value)}
                                rows={4}
                                style={{
                                    fontFamily: editedStyle.fontFamily,
                                    fontSize: `${editedStyle.fontSize}px`,
                                    fontWeight: editedStyle.isBold ? 'bold' : 'normal',
                                    fontStyle: editedStyle.isItalic ? 'italic' : 'normal',
                                    color: `rgb(${editedStyle.color.r * 255}, ${editedStyle.color.g * 255}, ${editedStyle.color.b * 255})`,
                                    backgroundColor: editedStyle.highlightColor ? `rgba(${editedStyle.highlightColor.r * 255}, ${editedStyle.highlightColor.g * 255}, ${editedStyle.highlightColor.b * 255}, ${editedStyle.highlightColor.a})` : 'transparent'
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveTextChange}>Save Change</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold">Edit Your Document</h1>
            <p className="text-muted-foreground mt-2">Click on any highlighted text block to modify its content.</p>
          </div>
          
           <div className="flex flex-col sm:flex-row justify-center items-center gap-4 my-4 p-4 bg-card border rounded-lg shadow-sm sticky top-0 z-10">
              <Button onClick={handleStartOver} variant="outline">Start Over</Button>
              <Button onClick={handleApplyEdits} size="lg">
                <Wand2 className="mr-2 h-4 w-4" />
                Apply All Changes
              </Button>
            </div>
            
            <div className="space-y-8">
              {pagesData.map((page, pageIndex) => (
                 <Card key={`page-${pageIndex}`}>
                    <CardContent className="p-2 flex flex-col justify-center items-center overflow-auto gap-4">
                        <Badge variant="secondary">Page {pageIndex + 1} of {pagesData.length}</Badge>
                        <div 
                          className="relative shadow-lg"
                          style={{ width: page.dimensions.width, height: page.dimensions.height, flexShrink: 0 }}
                        >
                          <img src={page.imageUrl} alt={`PDF page ${pageIndex + 1}`} className="absolute top-0 left-0 w-full h-full select-none" draggable={false} />
                          {page.textItems.map((item) => (
                              <div
                                  key={item.id}
                                  className="absolute border border-dashed border-blue-400/50 hover:border-blue-600 hover:bg-blue-400/20 cursor-pointer group/item"
                                  style={{
                                      left: `${item.x}px`,
                                      top: `${item.y}px`,
                                      width: `${item.width}px`,
                                      height: `${item.height}px`,
                                  }}
                                  onClick={() => openEditDialog(item)}
                              >
                                <div className="absolute -top-6 -right-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                  <Badge variant="secondary" className="bg-blue-600 text-white">
                                      <Edit className="w-3 h-3 mr-1"/> Edit
                                  </Badge>
                                </div>
                                {item.text !== item.originalText && (
                                  <div className="absolute top-0 left-0 w-full h-full bg-green-500/20 ring-2 ring-green-600 rounded-sm" />
                                )}
                              </div>
                          ))}
                        </div>
                    </CardContent>
                </Card>
              ))}
            </div>
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
