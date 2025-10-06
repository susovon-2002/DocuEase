'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type RepairStep = 'upload' | 'download';

export function RepairPdfClient() {
  const [step, setStep] = useState<RepairStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelectClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setOriginalFile(file);
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
      setOriginalFile(file);
    } else if (file) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only PDF files are supported for dropping.',
      });
    }
  };
  
  const handleRepair = async () => {
    if (!originalFile) return;

    setIsProcessing(true);
    try {
        const existingPdfBytes = await originalFile.arrayBuffer();
        
        // Attempt to load the PDF. pdf-lib can often handle some level of corruption.
        const pdfDoc = await PDFDocument.load(existingPdfBytes, { 
          // This option can help with some broken files
          ignoreEncryption: true 
        });

        // Create a new document and copy the pages. This rebuilds the structure.
        const newPdfDoc = await PDFDocument.create();
        const copiedPages = await newPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach(page => newPdfDoc.addPage(page));

        const pdfBytes = await newPdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        setOutputFile({ name: `${originalFile.name.replace('.pdf', '')}_repaired.pdf`, blob });
        setStep('download');
        toast({ title: 'Repair Successful!', description: 'The PDF structure has been rebuilt. Check the file to see if content was recovered.' });

    } catch (error) {
      console.error(error);
      toast({ 
        variant: 'destructive', 
        title: 'Repair Failed', 
        description: 'The file is too corrupted to be recovered with this tool. We were unable to read its contents.' 
      });
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
  };
  
  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Attempting to repair...</p>
        <p className="text-muted-foreground">This may take a moment.</p>
      </div>
    );
  }

  if (step === 'download') {
    return (
      <div className="w-full max-w-xl mx-auto text-center">
           <div className="mb-8">
              <h1 className="text-3xl font-bold">Repair Complete</h1>
              <p className="text-muted-foreground mt-2">Your repaired PDF is ready for download.</p>
          </div>
          <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-4">
                  <Wrench className="h-10 w-10 text-green-500"/>
                  <div>
                    <h3 className="font-semibold text-lg">{outputFile?.name}</h3>
                    <Badge variant="secondary">{outputFile?.blob.size ? (outputFile.blob.size / 1024).toFixed(2) : '0'} KB</Badge>
                  </div>
                </div>
              </CardContent>
          </Card>
          <div className="flex justify-center gap-4">
              <Button onClick={handleStartOver} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Repair Another
              </Button>
              <Button onClick={handleDownloadFile} size="lg">
                  <Download className="mr-2 h-4 w-4" />
                  Download Repaired PDF
              </Button>
          </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Repair PDF</h1>
        <p className="text-muted-foreground mt-2">Attempt to fix and recover data from a corrupted or damaged PDF file.</p>
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
      {originalFile && (
         <div className="mt-8 text-center">
            <Card className="max-w-md mx-auto">
                <CardContent className="p-4 flex flex-col items-center gap-4">
                    <p className="text-sm font-medium truncate">{originalFile.name}</p>
                    <Button onClick={handleRepair} size="lg">
                      <Wrench className="mr-2 h-4 w-4" />
                      Repair PDF
                    </Button>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
