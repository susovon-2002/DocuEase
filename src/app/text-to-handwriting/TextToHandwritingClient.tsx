
'use client';

import { useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Wand2, FileText, CaseSensitive, Palette, Ruler, Upload, Book, Droplets, Minus, Sigma } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

const fonts = [
  { name: 'Dancing Script', family: "'Dancing Script', cursive" },
  { name: 'Caveat', family: "'Caveat', cursive" },
  { name: 'Indie Flower', family: "'Indie Flower', cursive" },
  { name: 'Patrick Hand', family: "'Patrick Hand', cursive" },
  { name: 'Homemade Apple', family: "'Homemade Apple', cursive" },
  { name: 'Kalam', family: "'Kalam', cursive" },
  { name: 'Shadows Into Light', family: "'Shadows Into Light', cursive" },
  { name: 'Amatic SC', family: "'Amatic SC', cursive" },
  { name: 'Architects Daughter', family: "'Architects Daughter', cursive" },
  { name: 'Bad Script', family: "'Bad Script', cursive" },
  { name: 'Berkshire Swash', family: "'Berkshire Swash', cursive" },
  { name: 'Calligraffitti', family: "'Calligraffitti', cursive" },
  { name: 'Cedarville Cursive', family: "'Cedarville Cursive', cursive" },
  { name: 'Clicker Script', family: "'Clicker Script', cursive" },
  { name: 'Cookie', family: "'Cookie', cursive" },
  { name: 'Damion', family: "'Damion', cursive" },
  { name: 'Euphoria Script', family: "'Euphoria Script', cursive" },
  { name: 'Felipa', family: "'Felipa', cursive" },
  { name: 'Gochi Hand', family: "'Gochi Hand', cursive" },
  { name: 'Great Vibes', family: "'Great Vibes', cursive" },
  { name: 'Handlee', family: "'Handlee', cursive" },
  { name: 'Italianno', family: "'Italianno', cursive" },
  { name: 'Jim Nightshade', family: "'Jim Nightshade', cursive" },
  { name: 'Kristi', family: "'Kristi', cursive" },
  { name: 'La Belle Aurore', family: "'La Belle Aurore', cursive" },
  { name: 'Marck Script', family: "'Marck Script', cursive" },
  { name: 'Meddon', family: "'Meddon', cursive" },
  { name: 'Merienda', family: "'Merienda', cursive" },
  { name: 'Montez', family: "'Montez', cursive" },
  { name: 'Mr De Haviland', family: "'Mr De Haviland', cursive" },
  { name: 'Nanum Pen Script', family: "'Nanum Pen Script', cursive" },
  { name: 'Neucha', family: "'Neucha', cursive" },
  { name: 'Nothing You Could Do', family: "'Nothing You Could Do', cursive" },
  { name: 'Parisienne', family: "'Parisienne', cursive" },
  { name: 'Pinyon Script', family: "'Pinyon Script', cursive" },
  { name: 'Rock Salt', family: "'Rock Salt', cursive" },
  { name: 'Rouge Script', family: "'Rouge Script', cursive" },
  { name: 'Sacramento', family: "'Sacramento', cursive" },
  { name: 'Schoolbell', family: "'Schoolbell', cursive" },
  { name: 'Short Stack', family: "'Short Stack', cursive" },
  { name: 'The Girl Next Door', family: "'The Girl Next Door', cursive" },
  { name: 'Zeyada', family: "'Zeyada', cursive" },
  { name: 'Reenie Beanie', family: "'Reenie Beanie', cursive" },
  { name: 'Sue Ellen Francisco', family: "'Sue Ellen Francisco', cursive" },
  { name: 'Waiting for the Sunrise', family: "'Waiting for the Sunrise', cursive" },
  { name: 'Just Me Again Down Here', family: "'Just Me Again Down Here', cursive" },
  { name: 'Permanent Marker', family: "'Permanent Marker', cursive" },
  { name: 'Gloria Hallelujah', family: "'Gloria Hallelujah', cursive" },
];

const papers = [
    { id: 'gray-line', name: 'Gray Line', icon: Minus },
    { id: 'blue-line', name: 'Blue Line', icon: Sigma },
    { id: 'plain', name: 'Plain Paper', icon: Book },
    { id: 'white', name: 'White Paper', icon: Droplets },
]

export function TextToHandwritingClient() {
  const [text, setText] = useState('This free text to handwriting converter tool allows you to convert typed text into real human-like handwriting.');
  const [font, setFont] = useState(fonts[0].family);
  const [fontSize, setFontSize] = useState(24);
  const [fontColor, setFontColor] = useState('#000000');
  const [paperStyle, setPaperStyle] = useState('gray-line');
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [wordSpacing, setWordSpacing] = useState(0);
  const [showDateTimeHeader, setShowDateTimeHeader] = useState(true);

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
        const { width, height } = page.getSize();
        const fontRgb = hexToRgb(fontColor);

        // Set background color
        page.drawRectangle({
          x: 0,
          y: 0,
          width,
          height,
          color: rgb(1, 1, 1) // Always white background for paper effect
        });

        // This is a simplified version. pdf-lib needs fonts to be embedded
        // to render them properly. For this client-side version, we'll use
        // a standard font as a fallback for the PDF generation, so the output
        // PDF won't match the preview perfectly.
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const lineHeight = fontSize * 1.6;

        let y = height - 55;

        // Draw Date/Page Header
        if (showDateTimeHeader) {
            const headerText = `${new Date().toLocaleDateString()} | Page 1`;
            page.drawText(headerText, {
                x: width - 50 - helveticaFont.widthOfTextAtSize(headerText, 10),
                y: height - 40,
                font: helveticaFont,
                size: 10,
                color: rgb(fontRgb.r, fontRgb.g, fontRgb.b),
            });
            y -= 20;
        }

        // Draw lines if enabled
        const lineGap = lineHeight;
        const drawHorizontalLines = paperStyle === 'gray-line' || paperStyle === 'blue-line';
        const drawVerticalLine = paperStyle === 'blue-line' || paperStyle === 'plain';

        if (drawHorizontalLines) {
            const lineColor = paperStyle === 'gray-line' ? rgb(0.8, 0.8, 0.8) : rgb(0.8, 0.9, 1); // Light grey or blue
            for (let lineY = y; lineY > 50; lineY -= lineGap) {
                page.drawLine({
                    start: { x: 40, y: lineY },
                    end: { x: width - 40, y },
                    thickness: 0.5,
                    color: lineColor,
                });
            }
        }
        if (drawVerticalLine) {
            page.drawLine({
                start: { x: 40, y: height - 20 },
                end: { x: 40, y: 30 },
                thickness: 1,
                color: rgb(1, 0.8, 0.8), // Light red
            });
        }
        
        const lines = text.split('\n');
        
        for (const line of lines) {
             if (y < 50) {
                break; // Stop if we run out of space on one page
             }
             page.drawText(line, {
                x: 50,
                y,
                font: helveticaFont,
                size: fontSize,
                color: rgb(fontRgb.r, fontRgb.g, fontRgb.b),
                wordBreaks: [' '], // Use word spacing
             });
             y -= lineHeight;
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
        @import url('https://fonts.googleapis.com/css2?family=Amatic+SC&family=Architects+Daughter&family=Bad+Script&family=Berkshire+Swash&family=Calligraffitti&family=Caveat&family=Cedarville+Cursive&family=Clicker+Script&family=Cookie&family=Damion&family=Dancing+Script&family=Euphoria+Script&family=Felipa&family=Gloria+Hallelujah&family=Gochi+Hand&family=Great+Vibes&family=Handlee&family=Homemade+Apple&family=Indie+Flower&family=Italianno&family=Jim+Nightshade&family=Just+Me+Again+Down+Here&family=Kalam&family=Kristi&family=La+Belle+Aurore&family=Marck+Script&family=Meddon&family=Merienda&family=Montez&family=Mr+De+Haviland&family=Nanum+Pen+Script&family=Neucha&family=Nothing+You+Could+Do&family=Parisienne&family=Patrick+Hand&family=Permanent+Marker&family=Pinyon+Script&family=Reenie+Beanie&family=Rock+Salt&family=Rouge+Script&family=Sacramento&family=Schoolbell&family=Shadows+Into+Light&family=Short+Stack&family=Sue+Ellen+Francisco&family=The+Girl+Next+Door&family=Waiting+for+the+Sunrise&family=Zeyada&display=swap');
      `}</style>
      <div className="w-full max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Text to Handwriting</h1>
          <p className="text-muted-foreground mt-2">Convert typed text into a realistic handwritten style and download as a PDF.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 h-[calc(100vh-12rem)] overflow-y-auto pr-4 space-y-6">
                <Card>
                    <CardContent className="p-6 grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                           <Label><FileText className="inline-block mr-2" />Text to Convert</Label>
                           <Textarea 
                             value={text} 
                             onChange={(e) => setText(e.target.value)}
                             rows={8}
                             placeholder="Enter your text here..."
                           />
                        </div>
                        
                         <div className="space-y-4">
                            <Label>Handwriting Font</Label>
                            <div className="flex items-center space-x-2 border rounded-md p-3">
                                <Checkbox id="show-header" checked={showDateTimeHeader} onCheckedChange={v => setShowDateTimeHeader(Boolean(v))} />
                                <Label htmlFor="show-header" className="flex-grow">Show date and page number header</Label>
                                <Button variant="link" className="p-0 h-auto text-primary">(settings)</Button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <Card className="flex flex-col items-center justify-center text-center p-2 cursor-pointer aspect-square hover:bg-accent" onClick={() => toast({title: "Coming Soon!", description: "Custom font uploads will be available in a future update."})}>
                                    <Upload className="h-6 w-6 mb-1"/>
                                    <p className="text-xs font-medium">Upload Font</p>
                                </Card>
                                {fonts.map(f => (
                                    <Card 
                                        key={f.name} 
                                        className={cn(
                                            "flex flex-col items-center justify-center text-center p-2 cursor-pointer aspect-square",
                                            font === f.family ? 'ring-2 ring-primary' : 'hover:bg-accent'
                                        )}
                                        onClick={() => setFont(f.family)}
                                    >
                                        <p style={{fontFamily: f.family}} className="text-2xl">AaBb</p>
                                        <p className="text-xs font-medium truncate w-full">{f.name}</p>
                                    </Card>
                                ))}
                            </div>
                        </div>

                         <div className="space-y-4">
                            <Label>Papers</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {papers.map(p => {
                                    const Icon = p.icon;
                                    return (
                                        <Card
                                            key={p.id}
                                            className={cn(
                                                "flex flex-col items-center justify-center text-center p-2 cursor-pointer aspect-square",
                                                paperStyle === p.id ? 'ring-2 ring-primary' : 'hover:bg-accent'
                                            )}
                                            onClick={() => setPaperStyle(p.id)}
                                        >
                                            <Icon className="h-6 w-6 mb-1" />
                                            <p className="text-xs font-medium truncate w-full">{p.name}</p>
                                        </Card>
                                    )
                                })}
                            </div>
                         </div>


                         <div className="space-y-2">
                            <Label><Palette className="inline-block mr-2" />Ink Color</Label>
                            <div className="flex gap-4">
                                <Input id="font-color" type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="h-10 p-1 w-full"/>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Font Size ({fontSize}px)</Label>
                            <Slider value={[fontSize]} onValueChange={(v) => setFontSize(v[0])} min={12} max={48} step={1} />
                        </div>
                        <div className="space-y-2">
                            <Label><CaseSensitive className="inline-block mr-2" />Letter Spacing ({letterSpacing}px)</Label>
                            <Slider value={[letterSpacing]} onValueChange={(v) => setLetterSpacing(v[0])} min={-5} max={10} step={0.5} />
                        </div>
                         <div className="space-y-2">
                            <Label><CaseSensitive className="inline-block mr-2" />Word Spacing ({wordSpacing}px)</Label>
                            <Slider value={[wordSpacing]} onValueChange={(v) => setWordSpacing(v[0])} min={-5} max={20} step={1} />
                        </div>
                    </CardContent>
                </Card>
                 <Button onClick={handleDownload} disabled={isProcessing} size="lg" className="w-full">
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                    {isProcessing ? 'Generating PDF...' : 'Download as PDF'}
                </Button>
            </div>
            <div className="lg:col-span-2">
                 <div className="sticky top-24">
                     <Card>
                        <CardContent className="p-4">
                            <div 
                              className="w-full aspect-[4/5] border rounded-md p-8 overflow-hidden relative transition-colors bg-white"
                            >
                                {showDateTimeHeader && (
                                    <div className="absolute top-8 right-8 text-xs z-10" style={{color: fontColor}}>
                                        {new Date().toLocaleDateString()}
                                    </div>
                                )}
                                 {(paperStyle === 'blue-line' || paperStyle === 'plain') && (
                                    <div className="absolute top-0 left-12 bottom-0 w-px bg-red-300/70 pointer-events-none" style={{top: '2rem', bottom: '2rem'}}></div>
                                 )}

                                <div className="h-full overflow-y-auto">
                                    <div className="relative">
                                        {(paperStyle === 'gray-line' || paperStyle === 'blue-line') && (
                                            <div 
                                                className="absolute inset-0 pointer-events-none"
                                                style={{top: showDateTimeHeader ? '2rem' : '0'}}
                                            >
                                                {Array.from({ length: 40 }).map((_, i) => (
                                                    <div 
                                                        key={i} 
                                                        className="h-px"
                                                        style={{
                                                            backgroundColor: paperStyle === 'gray-line' ? 'rgba(0,0,0,0.2)' : 'rgba(200, 220, 255, 0.8)',
                                                            marginTop: `${fontSize * 1.6}px`
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        <pre 
                                            className="whitespace-pre-wrap font-inherit relative"
                                            style={{
                                                fontFamily: font,
                                                fontSize: `${fontSize}px`,
                                                color: fontColor,
                                                lineHeight: 1.6,
                                                letterSpacing: `${letterSpacing}px`,
                                                wordSpacing: `${wordSpacing}px`,
                                                paddingTop: showDateTimeHeader ? '2rem': '0',
                                            }}
                                        >{text}</pre>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                     <p className="text-xs text-muted-foreground mt-4 text-center">Live Preview. The downloaded PDF will use a standard font but will retain the text, size, color, and layout.</p>
                 </div>
            </div>
        </div>
      </div>
    </>
  );
}
