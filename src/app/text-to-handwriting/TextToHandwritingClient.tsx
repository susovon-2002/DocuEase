'use client';

import { useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

const fonts = [
  { name: 'Caveat', family: "'Caveat', cursive" },
  { name: 'Dancing Script', family: "'Dancing Script', cursive" },
  { name: 'Indie Flower', family: "'Indie Flower', cursive" },
  { name: 'Patrick Hand', family: "'Patrick Hand', cursive" },
  { name: 'Homemade Apple', family: "'Homemade Apple', cursive" },
];

export function TextToHandwritingClient() {
  const [text, setText] = useState('This free text to handwriting converter tool allows you to convert typed text into real human-like handwriting.');
  const [font, setFont] = useState(fonts[0].family);
  const [fontSize, setFontSize] = useState(24);
  const [fontColor, setFontColor] = useState('#000000');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  const handleDownload = async () => {
    if (!text) {
        toast({
            variant: 'destructive',
            title: 'No Text',
            description: 'Please enter some text to convert.',
        });
        return;
    }
    
    setIsProcessing(true);
    try {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        
        // This is a simplified version. pdf-lib needs fonts to be embedded
        // to render them properly. For this client-side version, we'll use
        // a standard font as a fallback for the PDF generation, so the output
        // PDF won't match the preview perfectly.
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const { width, height } = page.getSize();
        const color = hexToRgb(fontColor);

        const lines = text.split('\n');
        let y = height - 50;
        
        for (const line of lines) {
             if (y < 50) {
                break; // Stop if we run out of space on one page
             }
             page.drawText(line, {
                x: 50,
                y,
                font: helveticaFont,
                size: fontSize,
                color: rgb(color.r, color.g, color.b),
             });
             y -= (fontSize * 1.2);
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'handwriting.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({ title: 'PDF Generated!', description: 'Your handwritten text has been downloaded.' });
        
    } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not generate the PDF.'});
    } finally {
        setIsProcessing(false);
    }
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

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat&family=Dancing+Script&family=Indie+Flower&family=Patrick+Hand&family=Homemade+Apple&display=swap');
      `}</style>
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Text to Handwriting</h1>
          <p className="text-muted-foreground mt-2">Convert typed text into a realistic handwritten style and download as a PDF.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
                <Card>
                    <CardContent className="p-6 grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                           <Label>Text to Convert</Label>
                           <Textarea 
                             value={text} 
                             onChange={(e) => setText(e.target.value)}
                             rows={8}
                             placeholder="Enter your text here..."
                           />
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="font-select">Handwriting Font</Label>
                           <Select value={font} onValueChange={setFont}>
                                <SelectTrigger id="font-select">
                                    <SelectValue placeholder="Select a font" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fonts.map(f => (
                                        <SelectItem key={f.name} value={f.family} style={{fontFamily: f.family}}>
                                            {f.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Font Size ({fontSize}px)</Label>
                            <Slider value={[fontSize]} onValueChange={(v) => setFontSize(v[0])} min={12} max={48} step={1} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="font-color">Font Color</Label>
                            <Input id="font-color" type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="h-10 p-1"/>
                        </div>
                    </CardContent>
                </Card>
                 <Button onClick={handleDownload} disabled={isProcessing} size="lg" className="w-full">
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                    {isProcessing ? 'Generating PDF...' : 'Download as PDF'}
                </Button>
            </div>
            <div className="md:col-span-2">
                 <Card>
                    <CardContent className="p-4">
                        <div 
                          className="w-full aspect-[4/5] bg-white border rounded-md p-8 overflow-y-auto"
                          style={{
                            fontFamily: font,
                            fontSize: `${fontSize}px`,
                            color: fontColor,
                            lineHeight: 1.6
                          }}
                        >
                            <pre className="whitespace-pre-wrap font-inherit">{text}</pre>
                        </div>
                    </CardContent>
                </Card>
                 <p className="text-xs text-muted-foreground mt-4 text-center">Live Preview. The downloaded PDF will use a standard font but will retain the text, size, and color.</p>
            </div>
        </div>
      </div>
    </>
  );
}
