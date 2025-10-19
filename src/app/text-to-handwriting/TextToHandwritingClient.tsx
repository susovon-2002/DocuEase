
'use client';

import { useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Wand2, FileText, CaseSensitive, Palette, Ruler, Upload, Book, Droplets, Minus, Sigma, Image as ImageIcon } from 'lucide-react';
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
  { name: 'Dancing Script', family: "'Dancing Script', cursive", url: 'https://fonts.gstatic.com/s/dancingscript/v25/If2cXTr6YS-zF4S-kcSWSVi_sxjsohD9F50Ruu7BMSo3Rep8hA.ttf' },
  { name: 'Caveat', family: "'Caveat', cursive", url: 'https://fonts.gstatic.com/s/caveat/v17/WnznHAc5bAfYB2Q7aAnP-A.ttf' },
  { name: 'Indie Flower', family: "'Indie Flower', cursive", url: 'https://fonts.gstatic.com/s/indieflower/v17/m8JVjfNVeKWVnh3QMuKkFcZlKw.ttf' },
  { name: 'Patrick Hand', family: "'Patrick Hand', cursive", url: 'https://fonts.gstatic.com/s/patrickhand/v19/LDI1apSQOAYtSuYWp8ZhfYeMWQ.ttf' },
  { name: 'Homemade Apple', family: "'Homemade Apple', cursive", url: 'https://fonts.gstatic.com/s/homemadeapple/v17/Qw3EZQFXECDrI2q789EKQZJob3s.ttf' },
  { name: 'Kalam', family: "'Kalam', cursive", url: 'https://fonts.gstatic.com/s/kalam/v16/YA9dr0Wd4kDdMthQOC_A.ttf' },
  { name: 'Shadows Into Light', family: "'Shadows Into Light', cursive", url: 'https://fonts.gstatic.com/s/shadowsintolight/v15/UqyNK9UOIntux_czAv8kIZpjeV4.ttf' },
  { name: 'Amatic SC', family: "'Amatic SC', cursive", url: 'https://fonts.gstatic.com/s/amaticsc/v26/TUZyUseanmGILKvSZJMM_Q.ttf' },
  { name: 'Architects Daughter', family: "'Architects Daughter', cursive", url: 'https://fonts.gstatic.com/s/architectsdaughter/v16/KtkxAKiDZI_td1Lkx62xHZHDtg.ttf' },
  { name: 'Bad Script', family: "'Bad Script', cursive", url: 'https://fonts.gstatic.com/s/badscript/v16/6NUT8F6UgbdyGv9BiYc3Yg.ttf' },
  { name: 'Berkshire Swash', family: "'Berkshire Swash', cursive", url: 'https://fonts.gstatic.com/s/berkshireswash/v17/ptRRTi-cavZOGqCvnNJDl5m5Xw.ttf' },
  { name: 'Calligraffitti', family: "'Calligraffitti', cursive", url: 'https://fonts.gstatic.com/s/calligraffitti/v18/46k2lbT3XjDVqJw3DCmCFjE0.ttf' },
  { name: 'Cedarville Cursive', family: "'Cedarville Cursive', cursive", url: 'https://fonts.gstatic.com/s/cedarvillecursive/v19/yYL00g_a2veiudhUmxjo5VKko1A.ttf' },
  { name: 'Clicker Script', family: "'Clicker Script', cursive", url: 'https://fonts.gstatic.com/s/clickerscript/v13/dmFyOi1PZt_rI89523a5W3o_wQ.ttf' },
  { name: 'Cookie', family: "'Cookie', cursive", url: 'https://fonts.gstatic.com/s/cookie/v18/syky-y18lb0tSbf9kg.ttf' },
  { name: 'Damion', family: "'Damion', cursive", url: 'https://fonts.gstatic.com/s/damion/v15/hv-XlzJ3q-6P6d8_1A.ttf' },
  { name: 'Euphoria Script', family: "'Euphoria Script', cursive", url: 'https://fonts.gstatic.com/s/euphoriascript/v13/mFTpWb0X2bLb_cx6DcrWLVv7.ttf' },
  { name: 'Felipa', family: "'Felipa', cursive", url: 'https://fonts.gstatic.com/s/felipa/v15/FwZa7-s4wUdjG81-.ttf' },
  { name: 'Gochi Hand', family: "'Gochi Hand', cursive", url: 'https://fonts.gstatic.com/s/gochihand/v16/hES16Sl2C_6IuuWg-5G_pg.ttf' },
  { name: 'Great Vibes', family: "'Great Vibes', cursive", url: 'https://fonts.gstatic.com/s/greatvibes/v14/RWmMoKWR9v4ksMvYd2gW.ttf' },
  { name: 'Handlee', family: "'Handlee', cursive", url: 'https://fonts.gstatic.com/s/handlee/v14/P5uSgW-p_w_qg__w.ttf' },
  { name: 'Italianno', family: "'Italianno', cursive", url: 'https://fonts.gstatic.com/s/italianno/v15/vc1nwpZuZw9wW3Jda-q1.ttf' },
  { name: 'Jim Nightshade', family: "'Jim Nightshade', cursive", url: 'https://fonts.gstatic.com/s/jimnightshade/v13/PlIaFuIpARkChrva4rpkf3-d.ttf' },
  { name: 'Kristi', family: "'Kristi', cursive", url: 'https://fonts.gstatic.com/s/kristi/v17/uK_y4rqWcEky-jI_.ttf' },
  { name: 'La Belle Aurore', family: "'La Belle Aurore', cursive", url: 'https://fonts.gstatic.com/s/labelleaurore/v16/uHU-9GsF2PsL62cK_x7-go_g.ttf' },
  { name: 'Marck Script', family: "'Marck Script', cursive", url: 'https://fonts.gstatic.com/s/marckscript/v17/nwpTtK2oNgBA3Or78gap.ttf' },
  { name: 'Meddon', family: "'Meddon', cursive", url: 'https://fonts.gstatic.com/s/meddon/v21/kmK8ZqA2BxL4a2d-.ttf' },
  { name: 'Merienda', family: "'Merienda', cursive", url: 'https://fonts.gstatic.com/s/merienda/v14/gNMHW3x8Qoy5_mf8u_c.ttf' },
  { name: 'Montez', family: "'Montez', cursive", url: 'https://fonts.gstatic.com/s/montez/v24/845ZNMk5GoG2eA.ttf' },
  { name: 'Mr De Haviland', family: "'Mr De Haviland', cursive", url: 'https://fonts.gstatic.com/s/mrdehaviland/v14/OpNV-EzB_t81gK-C-UNp-FA.ttf' },
  { name: 'Nanum Pen Script', family: "'Nanum Pen Script', cursive", url: 'https://fonts.gstatic.com/s/nanumpenscript/v19/daaLssmEwepwba2kUcrI0A.ttf' },
  { name: 'Neucha', family: "'Neucha', cursive", url: 'https://fonts.gstatic.com/s/neucha/v18/q5uGsou0JOdh94bk.ttf' },
  { name: 'Nothing You Could Do', family: "'Nothing You Could Do', cursive", url: 'https://fonts.gstatic.com/s/nothingyoucoulddo/v15/oY1B8fbBpaP5F1evpgUL-bT_wA.ttf' },
  { name: 'Parisienne', family: "'Parisienne', cursive", url: 'https://fonts.gstatic.com/s/parisienne/v13/E21i_d3kivvG83fM4g.ttf' },
  { name: 'Pinyon Script', family: "'Pinyon Script', cursive", url: 'https://fonts.gstatic.com/s/pinyonscript/v16/6xK_d2Dy7pEV_z10T-7b6w.ttf' },
  { name: 'Rock Salt', family: "'Rock Salt', cursive", url: 'https://fonts.gstatic.com/s/rocksalt/v16/MwQ0bhv11fWD6QsAVOZ.ttf' },
  { name: 'Rouge Script', family: "'Rouge Script', cursive", url: 'https://fonts.gstatic.com/s/rougescript/v14/syky-y18lb0tSbf-scg.ttf' },
  { name: 'Sacramento', family: "'Sacramento', cursive", url: 'https://fonts.gstatic.com/s/sacramento/v13/buEzpo6gcdjy0EiurwI.ttf' },
  { name: 'Schoolbell', family: "'Schoolbell', cursive", url: 'https://fonts.gstatic.com/s/schoolbell/v16/92zQtWxDY2WLsm-b-y-.ttf' },
  { name: 'Short Stack', family: "'Short Stack', cursive", url: 'https://fonts.gstatic.com/s/shortstack/v15/bMr-Y5crOpgY-3CF_.ttf' },
  { name: 'The Girl Next Door', family: "'The Girl Next Door', cursive", url: 'https://fonts.gstatic.com/s/thegirlnextdoor/v16/pe0zMJCbPY0TJIqte_8Y-o29.ttf' },
  { name: 'Zeyada', family: "'Zeyada', cursive", url: 'https://fonts.gstatic.com/s/zeyada/v15/11hAGp_3YGCTv-s.ttf' },
  { name: 'Reenie Beanie', family: "'Reenie Beanie', cursive", url: 'https://fonts.gstatic.com/s/reeniebeanie/v16/z7NSdR76eDkaJKZJFkk.ttf' },
  { name: 'Sue Ellen Francisco', family: "'Sue Ellen Francisco', cursive", url: 'https://fonts.gstatic.com/s/sueellenfrancisco/v16/wremfA7slc-B9hmwkh_P31Y.ttf' },
  { name: 'Waiting for the Sunrise', family: "'Waiting for the Sunrise', cursive", url: 'https://fonts.gstatic.com/s/waitingforthesunrise/v16/WBL1rEb2NKnsuby0faPjOS-Ex0.ttf' },
  { name: 'Just Me Again Down Here', family: "'Just Me Again Down Here', cursive", url: 'https://fonts.gstatic.com/s/justmeagaindownhere/v22/MwQmbgX5Mffqimazvc7I-p2O.ttf' },
  { name: 'Permanent Marker', family: "'Permanent Marker', cursive", url: 'https://fonts.gstatic.com/s/permanentmarker/v16/Fh4uPib9Iyv2ucM6pGQ.ttf' },
  { name: 'Gloria Hallelujah', family: "'Gloria Hallelujah', cursive", url: 'https://fonts.gstatic.com/s/gloriahallelujah/v17/CA1k7d3y-ooH8v_9K8AFg.ttf' },
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
  
  const generatePdf = async (options: { targetText: string, targetFontFamily: string, pageCount: number }) => {
    const { targetText, targetFontFamily, pageCount } = options;

    if (!targetText) {
        toast({
            variant: 'destructive',
            title: 'No Text',
            description: 'Please enter some text to convert.',
        });
        return null;
    }
    
    setIsProcessing(true);
    try {
        const pdfDoc = await PDFDocument.create();
        const fontRgb = hexToRgb(fontColor);

        const selectedFont = fonts.find(f => f.family === targetFontFamily);
        let customFont;
        if (selectedFont?.url) {
            try {
                const fontBytes = await fetch(selectedFont.url).then(res => res.arrayBuffer());
                customFont = await pdfDoc.embedFont(fontBytes);
            } catch (e) {
                console.error("Failed to load custom font, falling back to Helvetica", e);
                toast({ variant: 'destructive', title: 'Font Load Error', description: 'Could not load the selected font for the PDF. Using a default font.' });
                customFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            }
        } else {
             customFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        }

        const lines = targetText.split('\n');
        const linesPerPage = Math.ceil(lines.length / 20); // Approx 20 lines per page

        for (let p = 0; p < pageCount; p++) {
          const page = pdfDoc.addPage();
          const { width, height } = page.getSize();
          
          page.drawRectangle({
            x: 0, y: 0, width, height, color: rgb(1, 1, 1)
          });
          
          let y = height - 50; 
          const lineHeight = fontSize * 1.6;

          if (showDateTimeHeader) {
              const headerText = `${new Date().toLocaleDateString()} | Page ${p + 1}`;
              const headerFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
              page.drawText(headerText, {
                  x: width - 50 - headerFont.widthOfTextAtSize(headerText, 10),
                  y: height - 40,
                  font: headerFont,
                  size: 10,
                  color: rgb(fontRgb.r, fontRgb.g, fontRgb.b),
              });
              y -= 30;
          }
          
          const drawHorizontalLines = paperStyle === 'gray-line' || paperStyle === 'blue-line';
          const drawVerticalLine = paperStyle === 'blue-line' || paperStyle === 'plain';

          if (drawVerticalLine) {
              page.drawLine({
                  start: { x: 40, y: height - 20 },
                  end: { x: 40, y: 30 },
                  thickness: 1,
                  color: rgb(1, 0.8, 0.8),
              });
          }

          const pageLines = lines.slice(p * linesPerPage, (p + 1) * linesPerPage);
          
          for (const line of pageLines) {
             if (y < 50) break;
             if (drawHorizontalLines) {
                 const lineColor = paperStyle === 'gray-line' ? rgb(0.8, 0.8, 0.8) : rgb(0.8, 0.9, 1);
                 page.drawLine({
                     start: { x: 40, y: y - 2 }, end: { x: width - 40, y: y - 2 }, thickness: 0.5, color: lineColor,
                 });
             }
             page.drawText(line, {
                x: 50, y: y, font: customFont, size: fontSize, color: rgb(fontRgb.r, fontRgb.g, fontRgb.b),
             });
             y -= lineHeight;
          }
        }
        
        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: 'application/pdf' });
        
    } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not generate the PDF.'});
        return null;
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDownload = async (type: 'all-pages-pdf' | 'this-page-pdf' | 'all-pages-img' | 'this-page-img', targetFont?: string) => {
    if ((type.includes('pdf') || type.includes('img')) && !text) {
       toast({ variant: 'destructive', title: 'No Text', description: 'Please enter some text to convert.'});
       return;
    }

    const currentFont = targetFont || font;

    if (type.endsWith('pdf')) {
      const pageCount = (type === 'this-page-pdf') ? 1 : Math.ceil(text.split('\n').length / 20); // Rough estimate for all pages
      const pdfBlob = await generatePdf({ targetText: text, targetFontFamily: currentFont, pageCount });
      if (pdfBlob) {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = targetFont ? `${fonts.find(f => f.family === targetFont)?.name}.pdf` : `handwriting_${type}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: 'PDF Generated!', description: 'Your handwritten text has been downloaded.' });
      }
    } else {
      toast({ title: 'Coming Soon', description: 'Image download functionality will be available in a future update.' });
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
                                            "relative group flex flex-col items-center justify-center text-center p-2 cursor-pointer aspect-square",
                                            font === f.family ? 'ring-2 ring-primary' : 'hover:bg-accent'
                                        )}
                                        onClick={() => setFont(f.family)}
                                    >
                                        <p style={{fontFamily: f.family}} className="text-2xl">AaBb</p>
                                        <p className="text-xs font-medium truncate w-full">{f.name}</p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload('this-page-pdf', f.family);
                                            }}
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
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
            </div>
            <div className="lg:col-span-2">
                 <div className="sticky top-24 flex gap-4">
                    <Card className="flex-grow">
                        <CardContent className="p-4">
                            <div className="w-full aspect-[210/297] border rounded-md overflow-hidden relative transition-colors bg-white">
                               {showDateTimeHeader && (
                                    <div className="absolute top-8 right-8 text-xs z-10" style={{color: fontColor}}>
                                        {new Date().toLocaleDateString()}
                                    </div>
                                )}
                                {(paperStyle === 'blue-line' || paperStyle === 'plain') && (
                                    <div className="absolute top-0 left-12 bottom-0 w-px bg-red-300/70 pointer-events-none" style={{top: '2rem', bottom: '2rem'}}></div>
                                 )}
                                 <div className="absolute inset-0 p-8 overflow-y-auto">
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
                                            className="whitespace-pre-wrap break-words font-inherit relative"
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
                    <Card className="w-48 flex-shrink-0">
                        <CardContent className="p-4 space-y-2">
                            <h3 className="text-sm font-semibold text-center text-muted-foreground">PDF OPTIONS</h3>
                            <Button onClick={() => handleDownload('all-pages-pdf')} disabled={isProcessing} className="w-full justify-start" variant="ghost">
                                <Download className="mr-2"/> Download all pages
                            </Button>
                             <Button onClick={() => handleDownload('this-page-pdf')} disabled={isProcessing} className="w-full justify-start" variant="ghost">
                                <Download className="mr-2"/> Download this page
                            </Button>
                            <h3 className="text-sm font-semibold text-center text-muted-foreground pt-4">IMAGE OPTIONS</h3>
                             <Button onClick={() => handleDownload('all-pages-img')} disabled={isProcessing} className="w-full justify-start" variant="ghost">
                                <ImageIcon className="mr-2"/> Download all pages
                            </Button>
                             <Button onClick={() => handleDownload('this-page-img')} disabled={isProcessing} className="w-full justify-start" variant="ghost">
                                <ImageIcon className="mr-2"/> Download this page
                            </Button>
                        </CardContent>
                    </Card>
                 </div>
            </div>
        </div>
      </div>
    </>
  );
}
