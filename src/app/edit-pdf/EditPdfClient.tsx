'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Wand2, ArrowLeft, Type } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type EditStep = 'upload' | 'edit' | 'download';

type TextItem = {
  str: string;
  transform: number[];
  width: number;
  height: number;
  dir: string;
};

type PageData = {
  pageIndex: number;
  width: number;
  height: number;
  imageUrl: string;
  textItems: TextItem[];
};

type EditAction = {
  pageIndex: number;
  type: 'text';
  item: TextItem;
  newText: string;
};

export function EditPdfClient() {
  const [step, setStep] = useState<EditStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [pagesData, setPagesData] = useState<PageData[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTextItem, setSelectedTextItem] = useState<TextItem | null>(null);
  const [editText, setEditText] = useState('');

  const [edits, setEdits] = useState<EditAction[]>([]);
  
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
    setProcessingMessage('Analyzing PDF...');
    
    try {
      const fileBuffer = await originalFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
      const allPagesData: PageData[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        setProcessingMessage(`Processing page ${i} of ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        if(!context) throw new Error('Could not get canvas context');

        await page.render({ canvasContext: context, viewport }).promise;
        const imageUrl = canvas.toDataURL('image/jpeg');

        const textContent = await page.getTextContent();
        const textItems = textContent.items.map(item => item as TextItem);
        
        allPagesData.push({
          pageIndex: i - 1,
          width: viewport.width,
          height: viewport.height,
          imageUrl,
          textItems,
        });
      }
      
      setPagesData(allPagesData);
      setStep('edit');
      toast({ title: 'PDF Loaded', description: 'Click on text to start editing.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not load the PDF for editing.' });
      handleStartOver();
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditModal = (item: TextItem) => {
    setSelectedTextItem(item);
    setEditText(item.str);
    setIsEditModalOpen(true);
  };
  
  const handleSaveEdit = () => {
    if (!selectedTextItem) return;
    
    const newEdit: EditAction = {
      type: 'text',
      pageIndex: currentPageIndex,
      item: selectedTextItem,
      newText: editText,
    };
    
    setEdits(prevEdits => [...prevEdits, newEdit]);
    setIsEditModalOpen(false);
    setSelectedTextItem(null);
    setEditText('');
    toast({ title: 'Edit Saved', description: 'Your change has been staged. Apply all edits to finalize.' });
  };
  
  const handleApplyEdits = async () => {
      if (edits.length === 0) {
        toast({ variant: 'destructive', title: 'No Edits Made', description: 'Please make some changes before applying.' });
        return;
      }
      
      setIsProcessing(true);
      setProcessingMessage("Applying changes...");
      
      try {
        const pdfDoc = await PDFDocument.load(await originalFile!.arrayBuffer());
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        for (const edit of edits) {
          const page = pdfDoc.getPage(edit.pageIndex);
          const { width: pageWidth, height: pageHeight } = page.getSize();
          const viewportScale = pagesData[edit.pageIndex].width / pageWidth;
          
          if(edit.type === 'text') {
            const item = edit.item;
            const fontSize = item.transform[3];
            
            const itemWidth = item.width * (fontSize / item.transform[3]) / viewportScale;
            const itemHeight = item.height * (fontSize / item.transform[0]) / viewportScale;
            
            const x = item.transform[4] / viewportScale;
            const y = pageHeight - (item.transform[5] / viewportScale) - (fontSize / viewportScale);

            page.drawRectangle({ x, y: y + 2, width: itemWidth, height: itemHeight, color: rgb(1, 1, 1) });
            page.drawText(edit.newText, { x, y, font, size: fontSize / viewportScale, color: rgb(0, 0, 0) });
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
    pagesData.forEach(p => URL.revokeObjectURL(p.imageUrl));
    setPagesData([]);
    setCurrentPageIndex(0);
    setEdits([]);
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
  
  const currentView = pagesData[currentPageIndex];
  
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
            <p className="text-muted-foreground mt-2">Modify text, images, and links directly in your PDF. A simple and effective online editor.</p>
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
        <div className="w-full max-w-6xl mx-auto">
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Text</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-2">
                <Label htmlFor="editText">Text</Label>
                <Input id="editText" value={editText} onChange={(e) => setEditText(e.target.value)} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveEdit}>Save Change</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Edit Your Document</h1>
            <p className="text-muted-foreground mt-2">Click on any text block to modify it.</p>
          </div>
          
           <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 mb-8">
              <Button onClick={handleStartOver} variant="outline">Start Over</Button>
              <div className="flex items-center gap-2">
                 <Button onClick={() => setCurrentPageIndex(p => Math.max(0, p - 1))} disabled={currentPageIndex === 0}>
                    Previous
                </Button>
                <span className="text-sm font-medium">Page {currentPageIndex + 1} of {pagesData.length}</span>
                 <Button onClick={() => setCurrentPageIndex(p => Math.min(pagesData.length - 1, p + 1))} disabled={currentPageIndex === pagesData.length - 1}>
                    Next
                </Button>
              </div>
              <Button onClick={handleApplyEdits} size="lg" disabled={edits.length === 0}>
                <Wand2 className="mr-2 h-4 w-4" />
                Apply All Edits ({edits.length})
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-2">
                 <div 
                    className="relative mx-auto overflow-auto"
                    style={{ width: currentView?.width, height: currentView?.height, maxWidth: '100%' }}
                >
                    <img src={currentView?.imageUrl} alt={`Page ${currentPageIndex + 1}`} className="w-full h-auto" />
                    <div className="absolute top-0 left-0 w-full h-full">
                        {currentView?.textItems.map((item, index) => {
                            const [fs, , , fh, x, y] = item.transform;
                             const isEdited = edits.some(e => e.type === 'text' && e.pageIndex === currentPageIndex && e.item.str === item.str);
                            return (
                                <div
                                    key={`text-${index}`}
                                    className={cn("absolute hover:bg-blue-500/30 cursor-pointer border border-dashed border-transparent hover:border-blue-500", isEdited && "bg-green-500/30")}
                                    style={{
                                        left: `${x}px`,
                                        top: `${y - item.height}px`,
                                        width: `${item.width}px`,
                                        height: `${item.height}px`,
                                    }}
                                    onClick={() => openEditModal(item)}
                                >
                                </div>
                            )
                        })}
                    </div>
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
