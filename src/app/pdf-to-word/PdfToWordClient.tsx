'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import * as pdfjsLib from 'pdfjs-dist';

type ConvertStep = 'upload' | 'download';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// A more robust text extraction function
async function getPdfText(file: File, onProgress: (message: string) => void): Promise<string> {
    const fileBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: fileBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        onProgress(`Extracting text from page ${i} of ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        if (textContent.items.length === 0) {
            fullText += '\n\n-- Page Break --\n\n';
            continue;
        }

        // Group text items by line
        const lines: { [y: number]: { text: string, x: number }[] } = {};
        for (const item of textContent.items) {
            if ('str' in item) {
                // Round the y-coordinate to group items on the same line
                const y = Math.round(item.transform[5]);
                if (!lines[y]) {
                    lines[y] = [];
                }
                lines[y].push({ text: item.str, x: item.transform[4] });
            }
        }

        // Sort lines by y-coordinate (top to bottom), then sort text within each line by x-coordinate (left to right)
        const sortedYCoords = Object.keys(lines).map(Number).sort((a, b) => b - a);
        
        let pageText = '';
        for (const y of sortedYCoords) {
            const lineItems = lines[y].sort((a, b) => a.x - b.x);
            const lineText = lineItems.map(item => item.text).join(' ');
            pageText += lineText + '\n';
        }

        fullText += pageText + '\n\n-- Page Break --\n\n';
    }

    return fullText.replace(/\n\n-- Page Break --\n\n$/, '');
}


export function PdfToWordClient() {
  const [step, setStep] = useState<ConvertStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob, textContent: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelectClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
        handleConvert(file);
    } else if (file) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only PDF files are supported.',
      });
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
       handleConvert(file);
    } else if (file) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only PDF files are supported for dropping.',
      });
    }
  };
  
  const handleConvert = async (file: File) => {
    setOriginalFile(file);
    setIsProcessing(true);
    setProcessingMessage('Converting PDF to text...');

    try {
        const fullText = await getPdfText(file, setProcessingMessage);
        
        const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
        
        setOutputFile({ 
            name: `${file.name.replace(/\.pdf$/i, '')}.txt`, 
            blob: blob,
            textContent: fullText
        });
        setStep('download');
        toast({ title: 'Conversion Complete!', description: 'The text from your PDF has been extracted.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not convert the PDF.' });
      handleStartOver();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setStep('upload');
    setOriginalFile(null);
    setOutputFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    toast({ title: "Note:", description: "This tool extracts text. For full Word conversion, a server-side solution would be needed. You can copy the extracted text into Word."})
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
            <h1 className="text-3xl font-bold">PDF to Word</h1>
            <p className="text-muted-foreground mt-2">Convert your PDFs to editable Word documents with accurate text recognition.</p>
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
    
    case 'download':
        return (
            <div className="w-full max-w-4xl mx-auto text-center">
                 <div className="mb-8">
                    <h1 className="text-3xl font-bold">Conversion Complete</h1>
                    <p className="text-muted-foreground mt-2">The text from your PDF has been extracted. Download it as a .txt file.</p>
                </div>
                <Card className="mb-8">
                    <CardContent className="p-4">
                        <textarea
                            readOnly
                            value={outputFile?.textContent}
                            className="w-full h-96 rounded-md border bg-muted p-4 text-sm font-mono"
                            placeholder="Extracted text will appear here."
                        />
                    </CardContent>
                </Card>
                <div className="flex justify-center gap-4">
                    <Button onClick={handleStartOver} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Convert Another
                    </Button>
                    <Button onClick={handleDownloadFile} size="lg">
                        <Download className="mr-2 h-4 w-4" />
                        Download Text File
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">Note: This tool extracts text only. For full DOCX conversion with formatting, a more advanced server-side solution is required.</p>
            </div>
        )
  }
}
