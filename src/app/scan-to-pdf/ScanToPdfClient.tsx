
'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, Download, RefreshCw, X, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

export function ScanToPdfClient() {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob } | null>(null);
  const [step, setStep] = useState<'camera' | 'preview'>('camera');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    let stream: MediaStream | null = null;

    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access.',
        });
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };

    if (step === 'camera') {
      getCameraPermission();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [step, toast]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    // Use PNG for better consistency
    const dataUrl = canvas.toDataURL('image/png');
    setCapturedImages((prev) => [...prev, dataUrl]);
    toast({
      title: 'Image Captured!',
      description: 'You can now capture another or generate a PDF.',
    });
  };

  const deleteImage = (index: number) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ Fixed version of PDF generation
  const handleGeneratePdf = async () => {
    if (capturedImages.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Images Captured',
        description: 'Please capture at least one image.',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const pdfDoc = await PDFDocument.create();

      for (const imageUrl of capturedImages) {
        const base64Data = imageUrl.split(',')[1];
        const pngImageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        const pngImage = await pdfDoc.embedPng(pngImageBytes);

        const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
        page.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: page.getWidth(),
          height: page.getHeight(),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setOutputFile({ name: 'scanned_document.pdf', blob });
      setStep('preview');
      toast({ title: 'PDF Generated Successfully!' });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast({
        variant: 'destructive',
        title: 'PDF Generation Failed',
        description: 'Could not create the PDF.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setCapturedImages([]);
    setOutputFile(null);
    setStep('camera');
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

  if (hasCameraPermission === null && step === 'camera') {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Requesting camera access...</p>
      </div>
    );
  }

  if (step === 'preview') {
    return (
      <div className="w-full max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Your Scanned PDF is Ready</h1>
          <p className="text-muted-foreground mt-2">Review the document below and download it.</p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-2">
            {outputFile && (
              <iframe
                src={URL.createObjectURL(outputFile.blob)}
                className="w-full h-[70vh] border-0"
                title="Final PDF Preview"
              />
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Button onClick={handleStartOver} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Scan Another
          </Button>
          <Button onClick={handleDownloadFile} size="lg">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Scan to PDF</h1>
        <p className="text-muted-foreground mt-2">
          Use your camera to capture documents and convert them to a PDF.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Camera View</CardTitle>
            <CardDescription>Position your document and capture.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              <canvas ref={canvasRef} className="hidden" />
              {hasCameraPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/50">
                  <Alert variant="destructive">
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                      Please allow camera access in your browser settings to use this feature.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
            <Button
              onClick={handleCapture}
              disabled={hasCameraPermission !== true || isProcessing}
              size="lg"
              className="w-full mt-4"
            >
              <Camera className="mr-2 h-4 w-4" />
              Capture Image
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Captured Pages</CardTitle>
            <CardDescription>Review your captured images here.</CardDescription>
          </CardHeader>
          <CardContent>
            {capturedImages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground border-2 border-dashed rounded-md py-20">
                Your captures will appear here.
              </div>
            ) : (
              <>
                <ScrollArea className="h-96 w-full rounded-md border p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {capturedImages.map((imgSrc, index) => (
                      <div key={index} className="relative group">
                        <img src={imgSrc} alt={`Capture ${index + 1}`} className="rounded-md w-full" />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Button onClick={handleGeneratePdf} disabled={isProcessing} size="lg" className="w-full mt-4">
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" /> Generate PDF ({capturedImages.length})
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
