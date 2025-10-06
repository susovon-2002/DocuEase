'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Edit, Bold, Italic, Palette, Highlighter, Underline, Strikethrough, Eraser, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type EditStep = 'upload' | 'edit';

type PageData = {
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
  fontFamily: string;
  fontSize: number;
  transform: number[];
  color: { r: number, g: number, b: number };
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  alignment: 'left' | 'center' | 'right';
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
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<TextItem | null>(null);
  const [editedText, setEditedText] = useState('');
  const [editedStyle, setEditedStyle] = useState({
      fontSize: 12,
      fontFamily: 'Helvetica',
      isBold: false,
      isItalic: false,
      isUnderline: false,
      isStrikethrough: false,
      alignment: 'left' as 'left' | 'center' | 'right',
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
          
          const scale = 1.5;
          const viewport = page.getViewport({ scale });
          
          const textContent = await page.getTextContent();
          
          const extractedTextItems: TextItem[] = textContent.items.map((item: any, index) => {
              const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
              const fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
              
              return {
                  id: `text-p${i}-${Date.now()}-${index}`,
                  pageIndex: i - 1,
                  text: item.str,
                  x: tx[4],
                  y: viewport.height - tx[5] - fontHeight,
                  width: item.width * viewport.scale,
                  height: item.height * viewport.scale,
                  fontSize: fontHeight,
                  fontFamily: item.fontName.includes('Bold') ? item.fontName.replace('Bold','') : item.fontName,
                  transform: item.transform,
                  isBold: item.fontName.includes('Bold'),
                  isItalic: item.fontName.includes('Italic'),
                  isUnderline: false,
                  isStrikethrough: false,
                  alignment: 'left',
                  color: { r: 0, g: 0, b: 0}, // pdf.js does not reliably provide color
                  highlightColor: null,
              };
          });

          processedPages.push({
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
      isUnderline: item.isUnderline,
      isStrikethrough: item.isStrikethrough,
      alignment: item.alignment,
      color: item.color,
      highlightColor: item.highlightColor
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveTextChange = () => {
    if (!currentItem) return;

    setPagesData(prevPagesData => {
      const newPagesData = [...prevPagesData];
      const pageData = newPagesData[currentItem.pageIndex];
      const itemIndex = pageData.textItems.findIndex(item => item.id === currentItem.id);
      
      if (itemIndex > -1) {
          pageData.textItems[itemIndex] = { 
              ...pageData.textItems[itemIndex], 
              text: editedText,
              ...editedStyle,
          };
      }
      return newPagesData;
    });

    setIsEditDialogOpen(false);
    setCurrentItem(null);
  };

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
        const newPdfDoc = await PDFDocument.create();
        
        for (const pageData of pagesData) {
            const { width, height, scale } = pageData.dimensions;
            const newPage = newPdfDoc.addPage([width / scale, height / scale]);

            for (const item of pageData.textItems) {
                const font = await getFont(newPdfDoc, item.fontFamily, item.isBold, item.isItalic);
                const textWidth = font.widthOfTextAtSize(item.text, item.fontSize / scale);

                let x_pos = item.x / scale;
                if (item.alignment === 'center') {
                    x_pos = (item.x + item.width / 2 - textWidth / 2) / scale;
                } else if (item.alignment === 'right') {
                    x_pos = (item.x + item.width - textWidth) / scale;
                }
                
                // Add highlight if exists
                if (item.highlightColor) {
                    newPage.drawRectangle({
                        x: item.x / scale,
                        y: (height - item.y - item.height) / scale,
                        width: item.width / scale,
                        height: item.height / scale,
                        color: rgb(item.highlightColor.r, item.highlightColor.g, item.highlightColor.b),
                        opacity: item.highlightColor.a,
                    });
                }
                
                // Draw new text
                newPage.drawText(item.text, {
                    x: x_pos,
                    y: (height - item.y - item.fontSize) / scale,
                    font: font,
                    size: item.fontSize / scale,
                    color: rgb(item.color.r, item.color.g, item.color.b),
                });

                // Add decorations
                const lineThickness = (item.fontSize / scale) / 15;
                if (item.isUnderline) {
                    newPage.drawLine({
                        start: { x: x_pos, y: ((height - item.y - item.fontSize) / scale) - lineThickness * 2 },
                        end: { x: x_pos + textWidth, y: ((height - item.y - item.fontSize) / scale) - lineThickness * 2 },
                        thickness: lineThickness,
                        color: rgb(item.color.r, item.color.g, item.color.b),
                    });
                }
                if (item.isStrikethrough) {
                     newPage.drawLine({
                        start: { x: x_pos, y: ((height - item.y - item.fontSize) / scale) + (item.height / scale) / 2.5 },
                        end: { x: x_pos + textWidth, y: ((height - item.y - item.fontSize) / scale) + (item.height / scale) / 2.5 },
                        thickness: lineThickness,
                        color: rgb(item.color.r, item.color.g, item.color.b),
                    });
                }
            }
        }
        
        const pdfBytes = await newPdfDoc.save();
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
        <div className="w-full">
           <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Text</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="p-2 rounded-md border bg-muted flex flex-wrap items-center gap-1">
                           <ToggleGroup type="multiple" value={
                                [
                                 editedStyle.isBold ? 'bold' : '',
                                 editedStyle.isItalic ? 'italic' : '',
                                 editedStyle.isUnderline ? 'underline' : '',
                                 editedStyle.isStrikethrough ? 'strikethrough' : ''
                                ].filter(Boolean)
                             } onValueChange={(value) => {
                                setEditedStyle(s => ({
                                    ...s,
                                    isBold: value.includes('bold'),
                                    isItalic: value.includes('italic'),
                                    isUnderline: value.includes('underline'),
                                    isStrikethrough: value.includes('strikethrough'),
                                }))
                             }}>
                               <ToggleGroupItem value="bold" aria-label="Toggle bold"><Bold className="h-4 w-4" /></ToggleGroupItem>
                               <ToggleGroupItem value="italic" aria-label="Toggle italic"><Italic className="h-4 w-4" /></ToggleGroupItem>
                               <ToggleGroupItem value="underline" aria-label="Toggle underline"><Underline className="h-4 w-4" /></ToggleGroupItem>
                               <ToggleGroupItem value="strikethrough" aria-label="Toggle strikethrough"><Strikethrough className="h-4 w-4" /></ToggleGroupItem>
                           </ToggleGroup>
                           <Separator orientation="vertical" className="h-6 mx-1" />
                           <Select value={editedStyle.fontFamily} onValueChange={v => setEditedStyle(s => ({...s, fontFamily: v}))}>
                               <SelectTrigger className="w-[140px]">
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
                           <Separator orientation="vertical" className="h-6 mx-1" />
                            <ToggleGroup type="single" value={editedStyle.alignment} onValueChange={(value: 'left' | 'center' | 'right') => { if(value) setEditedStyle(s => ({ ...s, alignment: value }))}}>
                               <ToggleGroupItem value="left" aria-label="Left aligned"><AlignLeft className="h-4 w-4" /></ToggleGroupItem>
                               <ToggleGroupItem value="center" aria-label="Center aligned"><AlignCenter className="h-4 w-4" /></ToggleGroupItem>
                               <ToggleGroupItem value="right" aria-label="Right aligned"><AlignRight className="h-4 w-4" /></ToggleGroupItem>
                           </ToggleGroup>
                           <Separator orientation="vertical" className="h-6 mx-1" />
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
                             <Button variant="ghost" size="icon" onClick={() => setEditedStyle(s => ({...s, highlightColor: null}))}>
                                <Eraser className="h-4 w-4" />
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
                                    textDecoration: `${editedStyle.isUnderline ? 'underline' : ''} ${editedStyle.isStrikethrough ? 'line-through' : ''}`.trim(),
                                    textAlign: editedStyle.alignment,
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
            <p className="text-muted-foreground mt-2">Click on any text block to modify its content and style.</p>
          </div>
          
           <div className="flex flex-col sm:flex-row justify-center items-center gap-4 my-4 p-4 bg-card border rounded-lg shadow-sm sticky top-0 z-10">
              <Button onClick={handleStartOver} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Start Over
              </Button>
              <Button onClick={handleDownload} size="lg" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {isProcessing ? processingMessage : 'Download Edited PDF'}
              </Button>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <ScrollArea className="h-[calc(100vh-250px)] border rounded-lg bg-secondary/50">
                <div className="p-4 sm:p-8 space-y-8 flex flex-col items-center">
                  {pagesData.map((page, pageIndex) => (
                      <div 
                        key={`editable-page-${pageIndex}`}
                        className="relative shadow-lg bg-white"
                        style={{ width: page.dimensions.width, height: page.dimensions.height, flexShrink: 0 }}
                      >
                        {page.textItems.map((item) => {
                          const textWidth = item.width;
                          let xPos = 0;
                          if (item.alignment === 'center') {
                              xPos = (item.width - textWidth) / 2;
                          } else if (item.alignment === 'right') {
                              xPos = item.width - textWidth;
                          }
                          return (
                            <div
                                key={item.id}
                                className="absolute border border-dashed border-transparent hover:border-blue-600 hover:bg-blue-400/20 cursor-pointer group/item"
                                style={{
                                    left: `${item.x}px`,
                                    top: `${item.y}px`,
                                    width: `${item.width}px`,
                                    height: `${item.height}px`,
                                }}
                                onClick={() => openEditDialog(item)}
                            >
                              <div 
                                  className="absolute flex items-center w-full h-full"
                                  style={{
                                      fontFamily: item.fontFamily.replace('g_d0_f', 'Helvetica'), // pdf.js internal font names
                                      fontSize: `${item.fontSize}px`,
                                      fontWeight: item.isBold ? 'bold' : 'normal',
                                      fontStyle: item.isItalic ? 'italic' : 'normal',
                                      textDecoration: `${item.isUnderline ? 'underline' : ''} ${item.isStrikethrough ? 'line-through' : ''}`.trim(),
                                      color: `rgb(${item.color.r * 255}, ${item.color.g * 255}, ${item.color.b * 255})`,
                                      backgroundColor: item.highlightColor ? `rgba(${item.highlightColor.r * 255}, ${item.highlightColor.g * 255}, ${item.highlightColor.b * 255}, ${item.highlightColor.a})` : 'transparent',
                                      justifyContent: item.alignment === 'left' ? 'flex-start' : item.alignment === 'center' ? 'center' : 'flex-end',
                                      paddingLeft: '2px',
                                      paddingRight: '2px',
                                  }}
                              >
                                {item.text}
                              </div>
                              <div className="absolute -top-6 right-0 opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none">
                                <span className="bg-blue-600 text-white text-xs font-bold py-1 px-2 rounded-md flex items-center">
                                    <Edit className="w-3 h-3 mr-1"/> Edit
                                </span>
                              </div>
                            </div>
                           )
                        })}
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
        </div>
      );
  }
}
