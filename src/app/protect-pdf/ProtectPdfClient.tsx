
'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Wand2, ArrowLeft, KeyRound, Printer, Copy, FilePenLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

type ProtectStep = 'upload' | 'options' | 'download';

export function ProtectPdfClient() {
  const [step, setStep] = useState<ProtectStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  
  // Permissions state
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowCopying, setAllowCopying] = useState(true);
  const [allowModifying, setAllowModifying] = useState(false);

  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelectClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setOriginalFile(file);
      setStep('options');
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
      setStep('options');
    } else if (file) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only PDF files are supported for dropping.',
      });
    }
  };
  
  const handleProtect = async () => {
    if (!originalFile) return;

    if (!password) {
      toast({ variant: 'destructive', title: 'Password Required', description: 'Please enter a password to protect the PDF.' });
      return;
    }

    setIsProcessing(true);
    setProcessingMessage('Encrypting PDF...');

    try {
        const fileBuffer = await originalFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBuffer);
        
        const pdfBytes = await pdfDoc.save({
          userPassword: password,
          permissions: {
            printing: allowPrinting,
            copying: allowCopying,
            modifying: allowModifying,
          }
        });

        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        setOutputFile({ name: `${originalFile!.name.replace('.pdf', '')}_protected.pdf`, blob });
        setStep('download');
        toast({ title: 'PDF Protected!', description: 'Your PDF has been successfully encrypted.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not protect the PDF.' });
      handleStartOver();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setStep('upload');
    setOriginalFile(null);
    setOutputFile(null);
    setPassword('');
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
            <h1 className="text-3xl font-bold">Protect PDF</h1>
            <p className="text-muted-foreground mt-2">Encrypt your PDF with a password to prevent unauthorized access.</p>
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
            <h1 className="text-3xl font-bold">Set Password & Permissions</h1>
            <p className="text-muted-foreground mt-2">Add a password and define what others can do with your file.</p>
          </div>
          <Card>
            <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            id="password" 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter a password"
                            className="pl-10"
                        />
                    </div>
                     <p className="text-xs text-muted-foreground">A password is required to open this document.</p>
                </div>

                <div className="space-y-4">
                    <Label>Permissions</Label>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="allowPrinting" checked={allowPrinting} onCheckedChange={c => setAllowPrinting(c as boolean)} />
                        <Label htmlFor="allowPrinting" className="flex items-center font-normal">
                          <Printer className="mr-2 h-4 w-4" /> Allow printing
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="allowCopying" checked={allowCopying} onCheckedChange={c => setAllowCopying(c as boolean)} />
                        <Label htmlFor="allowCopying" className="flex items-center font-normal">
                           <Copy className="mr-2 h-4 w-4" /> Allow copying content
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="allowModifying" checked={allowModifying} onCheckedChange={c => setAllowModifying(c as boolean)} />
                        <Label htmlFor="allowModifying" className="flex items-center font-normal">
                          <FilePenLine className="mr-2 h-4 w-4" /> Allow modifying
                        </Label>
                    </div>
                </div>
            </CardContent>
          </Card>
           <div className="flex justify-center gap-4 mt-8">
              <Button onClick={handleStartOver} variant="outline">Back</Button>
              <Button onClick={handleProtect} size="lg">
                <Wand2 className="mr-2 h-4 w-4" />
                Protect PDF
              </Button>
            </div>
        </div>
      );

    case 'download':
        return (
            <div className="w-full max-w-2xl mx-auto text-center">
                 <div className="mb-8">
                    <h1 className="text-3xl font-bold">PDF Protected!</h1>
                    <p className="text-muted-foreground mt-2">Your file is now encrypted and password protected.</p>
                </div>
                <Card className="mb-8 bg-muted">
                    <CardContent className="p-10 flex flex-col items-center justify-center gap-4">
                        <div className="bg-background p-4 rounded-full border">
                            <KeyRound className="h-12 w-12 text-primary"/>
                        </div>
                        <p className="font-semibold text-lg">Your PDF is ready for download.</p>
                        <p className="text-sm text-muted-foreground">The password will be required to open it.</p>
                    </CardContent>
                </Card>
                <div className="flex justify-center gap-4">
                    <Button onClick={handleGoBackToOptions} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Options
                    </Button>
                    <Button onClick={handleDownloadFile} size="lg">
                        <Download className="mr-2 h-4 w-4" />
                        Download Protected PDF
                    </Button>
                </div>
                <div className="flex justify-center mt-4">
                    <Button onClick={handleStartOver} variant="link">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Protect Another
                    </Button>
                </div>
            </div>
        )
  }
}
