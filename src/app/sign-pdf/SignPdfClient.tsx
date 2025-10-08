'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts, PDFImage } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Wand2, ArrowLeft, PenLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { renderPdfPagesToImageUrls } from '@/lib/pdf-utils';
import { Rnd } from 'react-rnd';
import { SignaturePad } from './SignaturePad';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type SignStep = 'upload' | 'sign' | 'download';

interface PageInfo {
  pageNumber: number;
  width: number;
  height: number;
  imageUrl: string;
}

interface SignatureInfo {
    pageIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
    signatureBytes: Uint8Array;
    signatureType: 'image/png' | 'image/jpeg';
}

export function SignPdfClient() {
  const [step, setStep] = useState<SignStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [pageInfos, setPageInfos] = useState<PageInfo[]>([]);
  
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [placedSignatures, setPlacedSignatures] = useState<SignatureInfo[]>([]);

  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelectClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      processFile(file);
    } else if (file) {
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'Only PDF files are supported.' });
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
       processFile(file);
    } else if (file) {
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'Only PDF files are supported for dropping.' });
    }
  };

  const processFile = async (file: File) => {
    setOriginalFile(file);
    setIsProcessing(true);
    setProcessingMessage('Rendering PDF...');
    try {
      const fileBuffer = await file.arrayBuffer();
      const imageUrls = await renderPdfPagesToImageUrls(new Uint8Array(fileBuffer.slice(0)));
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const infos: PageInfo[] = [];

      for (let i = 0; i < pdfDoc.getPageCount(); i++) {
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();
        infos.push({
          pageNumber: i + 1,
          width, 
          height,
          imageUrl: imageUrls[i],
        });
      }
      
      setPageInfos(infos);
      setStep('sign');
      toast({ title: 'PDF Loaded', description: 'Create your signature and place it on the document.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error Loading PDF', description: 'The file may be corrupt or encrypted.' });
      handleStartOver();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignatureCreated = (dataUrl: string) => {
    setSignatureData(dataUrl);
    toast({ title: 'Signature Created', description: 'Drag and drop it onto the PDF.' });
  };

  const handleSignatureDrop = (pageIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (!signatureData) return;

    const pageContainer = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - pageContainer.left;
    const y = e.clientY - pageContainer.top;

    const signatureType = signatureData.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
    const base64 = signatureData.split(',')[1];
    const signatureBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    setPlacedSignatures(prev => [...prev, {
        pageIndex,
        x: x - 75, // Center the initial drop
        y: y - 37.5,
        width: 150,
        height: 75,
        signatureBytes,
        signatureType,
    }]);
  };
  
  const handleApplySignature = async () => {
    if (!originalFile || placedSignatures.length === 0) {
        toast({ variant: 'destructive', title: 'No Signatures Placed', description: 'Please place at least one signature on the document.' });
        return;
    }

    setIsProcessing(true);
    setProcessingMessage('Applying signatures...');

    try {
        const pdfDoc = await PDFDocument.load(await originalFile.arrayBuffer());
        
        for (const sig of placedSignatures) {
            const page = pdfDoc.getPage(sig.pageIndex);
            
            let signatureImage: PDFImage;
            if (sig.signatureType === 'image/png') {
                signatureImage = await pdfDoc.embedPng(sig.signatureBytes);
            } else {
                signatureImage = await pdfDoc.embedJpg(sig.signatureBytes);
            }

            const scaleX = page.getWidth() / pageInfos[sig.pageIndex].width;
            const scaleY = page.getHeight() / pageInfos[sig.pageIndex].height;

            page.drawImage(signatureImage, {
                x: sig.x * scaleX,
                y: page.getHeight() - (sig.y * scaleY) - (sig.height * scaleY),
                width: sig.width * scaleX,
                height: sig.height * scaleY,
            });
        }
        
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        setOutputFile({ name: `${originalFile.name.replace('.pdf', '')}_signed.pdf`, blob });
        setStep('download');
        toast({ title: 'Signing Complete!', description: 'Your signed PDF is ready.' });
    } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Signing Failed', description: 'Could not apply the signatures.'});
    } finally {
        setIsProcessing(false);
    }
  };


  const handleStartOver = () => {
    setStep('upload');
    setOriginalFile(null);
    setOutputFile(null);
    pageInfos.forEach(p => URL.revokeObjectURL(p.imageUrl));
    setPageInfos([]);
    setPlacedSignatures([]);
    setSignatureData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGoBackToOptions = () => {
    setOutputFile(null);
    setStep('sign');
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
            <h1 className="text-3xl font-bold">Sign PDF</h1>
            <p className="text-muted-foreground mt-2">Sign yourself or request electronic signatures from others.</p>
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

    case 'sign':
      return (
        <div className="w-full max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Place Your Signature</h1>
            <p className="text-muted-foreground mt-2">Create your signature, then drag it onto the document.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
               <SignaturePad onSignatureCreate={handleSignatureCreated} />
               {signatureData && (
                <Card draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", "signature")}>
                    <CardContent className="p-4 flex flex-col items-center cursor-move">
                        <p className="text-sm font-semibold mb-2">Drag this to sign</p>
                        <img src={signatureData} alt="Your Signature" className="h-20 object-contain bg-muted p-2 rounded-md" />
                    </CardContent>
                </Card>
               )}
               <Button onClick={handleApplySignature} size="lg" className="w-full">
                 <Wand2 className="mr-2 h-4 w-4" /> Apply & Download
               </Button>
               <Button onClick={handleStartOver} variant="outline" className="w-full">Back</Button>
            </div>
             <div className="lg:col-span-2 space-y-4">
               {pageInfos.map((page, index) => (
                    <Card key={page.pageNumber}>
                        <CardContent className="p-2">
                           <div 
                             className="relative" 
                             style={{ width: page.width, height: page.height }}
                             onDragOver={(e) => e.preventDefault()}
                             onDrop={(e) => handleSignatureDrop(index, e)}
                            >
                                <img src={page.imageUrl} alt={`Page ${page.pageNumber}`} width={page.width} height={page.height} />
                                {placedSignatures.filter(s => s.pageIndex === index).map(sig => (
                                    <Rnd
                                        key={`${sig.pageIndex}-${sig.x}-${sig.y}`}
                                        size={{ width: sig.width, height: sig.height }}
                                        position={{ x: sig.x, y: sig.y }}
                                        onDragStop={(e, d) => {
                                            const newSigs = [...placedSignatures];
                                            const current = newSigs.find(s => s.x === sig.x && s.y === sig.y);
                                            if (current) {
                                                current.x = d.x;
                                                current.y = d.y;
                                            }
                                            setPlacedSignatures(newSigs);
                                        }}
                                        onResizeStop={(e, dir, ref, delta, pos) => {
                                             const newSigs = [...placedSignatures];
                                            const current = newSigs.find(s => s.x === sig.x && s.y === sig.y);
                                            if (current) {
                                                current.width = parseFloat(ref.style.width);
                                                current.height = parseFloat(ref.style.height);
                                                current.x = pos.x;
                                                current.y = pos.y;
                                            }
                                            setPlacedSignatures(newSigs);
                                        }}
                                        className="border-2 border-dashed border-primary"
                                    >
                                        <img src={URL.createObjectURL(new Blob([sig.signatureBytes], {type: sig.signatureType}))} alt="signature" className="w-full h-full" />
                                    </Rnd>
                                ))}
                           </div>
                        </CardContent>
                    </Card>
               ))}
            </div>
          </div>
        </div>
      );

    case 'download':
      return (
        <div className="w-full max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Process Complete!</h1>
            <p className="text-muted-foreground mt-2">Your signed PDF is ready to download.</p>
          </div>
          <Card className="mb-8">
            <CardContent className="p-2">
              {outputFile && <iframe src={URL.createObjectURL(outputFile.blob)} className="w-full h-[70vh] border-0" title="Final PDF Preview" />}
            </CardContent>
          </Card>
          <div className="flex justify-center gap-4">
            <Button onClick={handleGoBackToOptions} variant="outline">
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
              Sign Another File
            </Button>
          </div>
        </div>
      );
  }
}
