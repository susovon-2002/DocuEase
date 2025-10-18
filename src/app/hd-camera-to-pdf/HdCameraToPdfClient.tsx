
'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, Download, RefreshCw, X, Wand2, RotateCw, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

interface CapturedImage {
  id: number;
  dataUrl: string;
  rotation: number;
}

export function HdCameraToPdfClient() {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
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
        const constraints = {
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: 'environment',
          },
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
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

    const dataUrl = canvas.toDataURL('image/png');
    setCapturedImages((prev) => [...prev, { id: Date.now(), dataUrl, rotation: 0 }]);
    toast({
      title: 'Image Captured!',
      description: 'You can now capture another or generate a PDF.',
    });
  };

  const deleteImage = (id: number) => {
    setCapturedImages((prev) => prev.filter((img) => img.id !== id));
  };
  
  const rotateImage = (id: number, angle: number) => {
    setCapturedImages((prev) =>
      prev.map((img) => {
        if (img.id === id) {
          const newRotation = (img.rotation + angle) % 360;
          return { ...img, rotation: newRotation < 0 ? 360 + newRotation : newRotation };
        }
        return img;
      })
    );
  };

  const handleImageOrderChange = (id: number, newPositionStr: string) => {
    const newPosition = parseInt(newPositionStr, 10);
    const currentIndex = capturedImages.findIndex(img => img.id === id);

    if (isNaN(newPosition) || newPosition < 1 || newPosition > capturedImages.length) {
        toast({
            variant: 'destructive',
            title: 'Invalid Position',
            description: `Please enter a number between 1 and ${capturedImages.length}.`
        });
        return;
    }

    setCapturedImages(currentImages => {
        const newImages = [...currentImages];
        const itemToMove = newImages.splice(currentIndex, 1)[0];
        newImages.splice(newPosition - 1, 0, itemToMove);
        return newImages;
    });
  };


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

      for (const image of capturedImages) {
        const base64Data = image.dataUrl.split(',')[1];
        const pngImageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        const pngImage = await pdfDoc.embedPng(pngImageBytes);

        const isSideways = image.rotation === 90 || image.rotation === 270;
        const page = pdfDoc.addPage(isSideways ? [pngImage.height, pngImage.width] : [pngImage.width, pngImage.height]);
        
        page.drawImage(pngImage, {
          x: page.getWidth() / 2 - (isSideways ? page.getHeight() : page.getWidth()) / 2,
          y: page.getHeight() / 2 - (isSideways ? page.getWidth() : page.getHeight()) / 2,
          width: page.getWidth(),
          height: page.getHeight(),
          rotate: degrees(-image.rotation), // pdf-lib rotates counter-clockwise
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
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">HD Camera to PDF</h1>
        <p className="text-muted-foreground mt-2">
          Use your camera to capture high-quality documents and convert them to a PDF.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Camera View</CardTitle>
            <CardDescription>Position your document in the frame and click capture.</CardDescription>
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
            <CardDescription>Review, reorder, and rotate your captured images.</CardDescription>
          </CardHeader>
          <CardContent>
            {capturedImages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground border-2 border-dashed rounded-md py-20">
                Your captures will appear here.
              </div>
            ) : (
              <>
                <ScrollArea className="h-[28rem] w-full rounded-md border p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {capturedImages.map((img, index) => (
                      <div key={img.id} className="relative group space-y-2">
                        <img 
                            src={img.dataUrl} 
                            alt={`Capture ${index + 1}`} 
                            className="rounded-md w-full"
                            style={{ transform: `rotate(${img.rotation}deg)` }}
                        />
                        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="destructive" size="icon" className="h-6 w-6" onClick={() => deleteImage(img.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                           <Button variant="secondary" size="icon" className="h-6 w-6" onClick={() => rotateImage(img.id, 90)}>
                            <RotateCw className="h-4 w-4" />
                          </Button>
                           <Button variant="secondary" size="icon" className="h-6 w-6" onClick={() => rotateImage(img.id, -90)}>
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                            type="text"
                            defaultValue={index + 1}
                            onBlur={(e) => handleImageOrderChange(img.id, e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleImageOrderChange(img.id, (e.target as HTMLInputElement).value);
                                    (e.target as HTMLInputElement).blur();
                                }
                            }}
                            onFocus={(e) => e.target.select()}
                            className="h-8 w-full text-center p-1 z-10"
                        />
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
