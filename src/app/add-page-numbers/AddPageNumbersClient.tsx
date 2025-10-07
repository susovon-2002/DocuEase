'use client';

import { useState, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Wand2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type AddNumbersStep = 'upload' | 'options' | 'download';
type Position =
  | 'bottom-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'top-left'
  | 'top-right';

export function AddPageNumbersClient() {
  const [step, setStep] = useState<AddNumbersStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);

  // Options state
  const [position, setPosition] = useState<Position>('bottom-center');
  const [format, setFormat] = useState('{page}');
  const [startPage, setStartPage] = useState('1');
  const [endPage, setEndPage] = useState('');
  
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelectClick = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      try {
        const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
        setTotalPages(pdfDoc.getPageCount());
        setEndPage(pdfDoc.getPageCount().toString());
        setOriginalFile(file);
        setStep('options');
      } catch (e) {
        toast({ variant: 'destructive', title: 'Invalid PDF', description: 'Could not read the provided PDF file.' });
      }
    } else if (file) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only PDF files are supported.',
      });
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
     if (file && file.type === 'application/pdf') {
      try {
        const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
        setTotalPages(pdfDoc.getPageCount());
        setEndPage(pdfDoc.getPageCount().toString());
        setOriginalFile(file);
        setStep('options');
      } catch (e) {
        toast({ variant: 'destructive', title: 'Invalid PDF', description: 'Could not read the provided PDF file.' });
      }
    } else if (file) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only PDF files are supported for dropping.',
      });
    }
  };
  
  const handleAddNumbers = async () => {
    if (!originalFile) return;

    const start = parseInt(startPage, 10);
    const end = parseInt(endPage, 10);

    if(isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
        toast({ variant: 'destructive', title: 'Invalid page range', description: `Please enter a valid range between 1 and ${totalPages}.` });
        return;
    }

    setIsProcessing(true);
    setProcessingMessage('Adding page numbers...');

    try {
        const fileBuffer = await originalFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBuffer);
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const pages = pdfDoc.getPages();

        for (let i = start - 1; i < end; i++) {
            setProcessingMessage(`Processing page ${i + 1} of ${end}...`);
            const page = pages[i];
            const { width, height } = page.getSize();
            
            const pageNumberText = format
                .replace('{page}', String(i + 1))
                .replace('{totalPages}', String(totalPages));
            
            const textWidth = helveticaFont.widthOfTextAtSize(pageNumberText, 12);
            const textHeight = helveticaFont.heightAtSize(12);

            let x: number, y: number;
            const margin = 40;

            switch(position) {
                case 'bottom-center':
                    x = width / 2 - textWidth / 2;
                    y = margin;
                    break;
                case 'bottom-left':
                    x = margin;
                    y = margin;
                    break;
                case 'bottom-right':
                    x = width - textWidth - margin;
                    y = margin;
                    break;
                case 'top-center':
                    x = width / 2 - textWidth / 2;
                    y = height - textHeight - margin;
                    break;
                case 'top-left':
                    x = margin;
                    y = height - textHeight - margin;
                    break;
                case 'top-right':
                    x = width - textWidth - margin;
                    y = height - textHeight - margin;
                    break;
            }

            page.drawText(pageNumberText, {
                x,
                y,
                size: 12,
                font: helveticaFont,
                color: rgb(0, 0, 0),
            });
        }
        
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        setOutputFile({ name: `${originalFile!.name.replace('.pdf', '')}_numbered.pdf`, blob });
        setStep('download');
        toast({ title: 'Page Numbers Added!', description: 'Your PDF is ready for download.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not add page numbers to the PDF.' });
      handleStartOver();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setStep('upload');
    setOriginalFile(null);
    setOutputFile(null);
    setTotalPages(0);
    setStartPage('1');
    setEndPage('');
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
            <h1 className="text-3xl font-bold">Add Page Numbers</h1>
            <p className="text-muted-foreground mt-2">Insert page numbers into your PDF with ease. Customize position, format, and range.</p>
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
            <h1 className="text-3xl font-bold">Numbering Options</h1>
            <p className="text-muted-foreground mt-2">Customize how your page numbers appear.</p>
          </div>
          <Card>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Select value={position} onValueChange={(v) => setPosition(v as Position)}>
                        <SelectTrigger id="position">
                            <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="bottom-center">Bottom Center</SelectItem>
                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                            <SelectItem value="top-center">Top Center</SelectItem>
                            <SelectItem value="top-left">Top Left</SelectItem>
                            <SelectItem value="top-right">Top Right</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="format">Format</Label>
                    <Input id="format" value={format} onChange={(e) => setFormat(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Use {`{page}`} and {`{totalPages}`}.</p>
                </div>
                <div className="space-y-2">
                    <Label>Page range</Label>
                     <div className="flex items-center gap-2">
                        <Input 
                            type="number"
                            placeholder="From"
                            value={startPage}
                            onChange={e => setStartPage(e.target.value)}
                            min="1"
                            max={totalPages}
                        />
                        <span>to</span>
                        <Input
                            type="number"
                            placeholder="To"
                            value={endPage}
                            onChange={e => setEndPage(e.target.value)}
                            min="1"
                            max={totalPages}
                        />
                    </div>
                </div>
            </CardContent>
          </Card>
           <div className="flex justify-center gap-4 mt-8">
              <Button onClick={handleStartOver} variant="outline">Back</Button>
              <Button onClick={handleAddNumbers} size="lg">
                <Wand2 className="mr-2 h-4 w-4" />
                Add Page Numbers
              </Button>
            </div>
        </div>
      );

    case 'download':
        return (
            <div className="w-full max-w-4xl mx-auto text-center">
                 <div className="mb-8">
                    <h1 className="text-3xl font-bold">Process Complete!</h1>
                    <p className="text-muted-foreground mt-2">Your numbered PDF is ready to download.</p>
                </div>
                <div className="flex justify-center gap-4">
                    <Button onClick={handleStartOver} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Process Another
                    </Button>
                    <Button onClick={handleDownloadFile} size="lg">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                </div>
                 <div className="flex justify-center mt-4">
                    <Button onClick={handleGoBackToOptions} variant="link">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Options
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
