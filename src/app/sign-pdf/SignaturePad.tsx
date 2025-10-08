'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Brush, Type, Upload } from 'lucide-react';

interface SignaturePadProps {
  onSignatureCreate: (dataUrl: string) => void;
}

export function SignaturePad({ onSignatureCreate }: SignaturePadProps) {
  const [activeTab, setActiveTab] = useState('draw');
  
  // Draw state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Type state
  const [typedText, setTypedText] = useState('Your Name');
  const [font, setFont] = useState('cursive');

  // Upload state
  const uploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && activeTab === 'draw') {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'type') {
      drawTypedSignature();
    }
  }, [typedText, font, activeTab]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const pos = getMousePos(canvas, e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getMousePos(canvas, e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };
  
  const getMousePos = (canvas: HTMLCanvasElement, e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvas.getBoundingClientRect();
    if (e.nativeEvent instanceof MouseEvent) {
      return {
        x: e.nativeEvent.clientX - rect.left,
        y: e.nativeEvent.clientY - rect.top,
      };
    }
    if (e.nativeEvent instanceof TouchEvent) {
      return {
        x: e.nativeEvent.touches[0].clientX - rect.left,
        y: e.nativeEvent.touches[0].clientY - rect.top,
      };
    }
    return {x: 0, y: 0};
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  
  const drawTypedSignature = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `50px ${font}`;
    ctx.fillStyle = '#000000';
    ctx.fillText(typedText, 20, 90);
    
    onSignatureCreate(canvas.toDataURL('image/png'));
  };

  const handleCreateSignature = () => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (canvas) {
        onSignatureCreate(canvas.toDataURL('image/png'));
      }
    } else if (activeTab === 'type') {
       drawTypedSignature();
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            onSignatureCreate(loadEvent.target?.result as string);
        }
        reader.readAsDataURL(file);
    }
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>Create Signature</CardTitle>
        </CardHeader>
        <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="draw"><Brush className="mr-2 h-4 w-4" />Draw</TabsTrigger>
                    <TabsTrigger value="type"><Type className="mr-2 h-4 w-4" />Type</TabsTrigger>
                    <TabsTrigger value="upload"><Upload className="mr-2 h-4 w-4" />Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="draw" className="mt-4">
                    <canvas
                        ref={canvasRef}
                        width="400"
                        height="150"
                        className="bg-muted rounded-md border w-full"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <Button variant="ghost" onClick={clearCanvas}>Clear</Button>
                        <Button onClick={handleCreateSignature}>Create</Button>
                    </div>
                </TabsContent>
                <TabsContent value="type" className="mt-4 space-y-4">
                    <Input
                        type="text"
                        value={typedText}
                        onChange={(e) => setTypedText(e.target.value)}
                        style={{ fontFamily: font, fontSize: '2rem' }}
                        className="h-20"
                    />
                    <div className="flex justify-end">
                       <Button onClick={handleCreateSignature}>Create</Button>
                    </div>
                </TabsContent>
                <TabsContent value="upload" className="mt-4">
                    <input type="file" ref={uploadInputRef} onChange={handleUpload} accept="image/*" className="hidden"/>
                    <Button onClick={() => uploadInputRef.current?.click()} className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Signature Image
                    </Button>
                </TabsContent>
            </Tabs>
        </CardContent>
    </Card>
  );
}
