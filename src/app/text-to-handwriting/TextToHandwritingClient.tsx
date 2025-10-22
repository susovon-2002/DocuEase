
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
  { name: 'Great Vibes', family: "'Great Vibes', cursive", url: 'https://fonts.gstatic.com/s/greatvives/v14/RWmMoKWR9v4ksMvYd2gW.ttf' },
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
  { name: 'Patrick Hand', family: "'Patrick Hand', cursive", url: 'https://fonts.gstatic.com/s/patrickhand/v19/LDI1apSQOAYtSuYWp8Zhfw.ttf' },
  { name: 'Permanent Marker', family: "'Permanent Marker', cursive", url: 'https://fonts.gstatic.com/s/permanentmarker/v16/Fh4uPib9Iyv2ucM6pGQ.ttf' },
  { name: 'Pinyon Script', family: "'Pinyon Script', cursive", url: 'https://fonts.gstatic.com/s/pinyonscript/v16/6xK_d2Dy7pEV_z10T-7b6w.ttf' },
  { name: 'Reenie Beanie', family: "'Reenie Beanie', cursive", url: 'https://fonts.gstatic.com/s/reeniebeanie/v16/z7NSdR76eDkaJKZJFkk.ttf' },
  { name: 'Rock Salt', family: "'Rock Salt', cursive", url: 'https://fonts.gstatic.com/s/rocksalt/v16/MwQ0bhv11fWD6QsAVOZ.ttf' },
  { name: 'Rouge Script', family: "'Rouge Script', cursive", url: 'https://fonts.gstatic.com/s/rougescript/v14/syky-y18lb0tSbf-scg.ttf' },
  { name: 'Sacramento', family: "'Sacramento', cursive", url: 'https://fonts.gstatic.com/s/sacramento/v13/buEzpo6gcdjy0EiurwI.ttf' },
  { name: 'Schoolbell', family: "'Schoolbell', cursive", url: 'https://fonts.gstatic.com/s/schoolbell/v16/92zQtWxDY2WLsm-b-y-.ttf' },
  { name: 'Short Stack', family: "'Short Stack', cursive", url: 'https://fonts.gstatic.com/s/shortstack/v15/bMr-Y5crOpgY-3CF_.ttf' },
  { name: 'The Girl Next Door', family: "'The Girl Next Door', cursive", url: 'https://fonts.gstatic.com/s/thegirlnextdoor/v16/pe0zMJCbPY0TJIqte_8Y-o29.ttf' },
  { name: 'Waiting for the Sunrise', family: "'Waiting for the Sunrise', cursive", url: 'https://fonts.gstatic.com/s/waitingforthesunrise/v16/WBL1rEb2NKnsuby0faPjOS-Ex0.ttf' },
  { name: 'Zeyada', family: "'Zeyada', cursive", url: 'https://fonts.gstatic.com/s/zeyada/v15/11hAGp_3YGCTv-s.ttf' },
  { name: 'Sue Ellen Francisco', family: "'Sue Ellen Francisco', cursive", url: 'https://fonts.gstatic.com/s/sueellenfrancisco/v16/wremfA7slc-B9hmwkh_P31Y.ttf' },
  { name: 'Just Me Again Down Here', family: "'Just Me Again Down Here', cursive", url: 'https://fonts.gstatic.com/s/justmeagaindownhere/v22/MwQmbgX5Mffqimazvc7I-p2O.ttf' },
  { name: 'Gloria Hallelujah', family: "'Gloria Hallelujah', cursive", url: 'https://fonts.gstatic.com/s/gloriahallelujah/v17/CA1k7d3y-ooH8v_9K8AFg.ttf' },
];

const papers = [
    { id: 'plain', name: 'Plain Paper', icon: Book, color: 'text-cyan-400' },
    { id: 'gray-line', name: 'Gray Line', icon: Minus, color: 'text-gray-400' },
    { id: 'blue-line', name: 'Blue Line', icon: Sigma, color: 'text-blue-400' },
    { id: 'white', name: 'White Paper', icon: Droplets, color: 'text-white' },
]

export function TextToHandwritingClient() {
  const [text, setText] = useState('Type your text here...');
  const [font, setFont] = useState(fonts[0].family);
  const [fontSize, setFontSize] = useState(24);
  const [fontColor, setFontColor] = useState('#00e5ff');
  const [paperStyle, setPaperStyle] = useState('plain');

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
                const fontRes = await fetch(`/api/fetch-font?url=${encodeURIComponent(selectedFont.url)}`);
                if (!fontRes.ok) {
                    throw new Error(`Failed to fetch font: ${fontRes.statusText}`);
                }
                const fontBytes = await fontRes.arrayBuffer();
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
        const linesPerPage = Math.floor((595 - 100) / (fontSize * 1.2)); // A4 height, rough estimate
        const totalPages = pageCount > 0 ? pageCount : Math.ceil(lines.length / linesPerPage);


        for (let p = 0; p < totalPages; p++) {
          const page = pdfDoc.addPage();
          const { width, height } = page.getSize();
          
           if (paperStyle !== 'white') {
             page.drawRectangle({
                x: 0, y: 0, width, height, color: rgb(0.06, 0.09, 0.13) // Dark blue bg
             });
           }
          
          let y = height - 60; 
          const lineHeight = fontSize * 1.5;

          const drawHorizontalLines = paperStyle === 'gray-line' || paperStyle === 'blue-line';
          const drawVerticalLine = paperStyle === 'blue-line' || paperStyle === 'plain';

          if (drawVerticalLine) {
              page.drawLine({
                  start: { x: 50, y: height - 40 },
                  end: { x: 50, y: 40 },
                  thickness: 1,
                  color: rgb(1, 0.2, 0.4),
                  opacity: 0.7,
              });
          }

          if (drawHorizontalLines) {
              for (let i = 0; y - (i * lineHeight) > 40; i++) {
                  const currentY = y - (i * lineHeight);
                  const lineColor = paperStyle === 'gray-line' ? rgb(0.5, 0.5, 0.5) : rgb(0.2, 0.4, 1);
                  page.drawLine({ start: { x: 40, y: currentY }, end: { x: width - 40, y: currentY }, thickness: 0.5, color: lineColor, opacity: 0.5 });
              }
          }
          
          const pageLines = lines.slice(p * linesPerPage, (p + 1) * linesPerPage);
          
          for (const line of pageLines) {
             if (y < 40 + fontSize) break;
             page.drawText(line, {
                x: 55,
                y: y - fontSize - (fontSize * 0.2), // Adjust y for baseline
                font: customFont,
                size: fontSize,
                color: rgb(fontRgb.r, fontRgb.g, fontRgb.b),
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
      const pageCount = (type === 'this-page-pdf') ? 1 : 0;
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
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Amatic+SC&family=Architects+Daughter&family=Bad+Script&family=Berkshire+Swash&family=Calligraffitti&family=Caveat&family=Cedarville+Cursive&family=Clicker+Script&family=Cookie&family=Damion&family=Dancing+Script&family=Euphoria+Script&family=Felipa&family=Gloria+Hallelujah&family=Gochi+Hand&family=Great+Vibes&family=Handlee&family=Homemade+Apple&family=Indie+Flower&family=Italianno&family=Jim+Nightshade&family=Just+Me+Again+Down+Here&family=Kalam&family=Kristi&family=La+Belle+Aurore&family=Marck+Script&family=Meddon&family=Merienda&family=Montez&family=Mr+De+Haviland&family=Nanum+Pen+Script&family=Neucha&family=Nothing+You+Could+Do&family=Parisienne&family=Patrick+Hand&family=Permanent+Marker&family=Pinyon+Script&family=Reenie+Beanie&family=Rock+Salt&family=Rouge+Script&family=Sacramento&family=Schoolbell&family=Shadows+Into+Light&family=Short+Stack&family=Sue+Ellen+Francisco&family=The+Girl+Next+Door&family=Waiting+for+the+Sunrise&family=Zeyada&display=swap');
      `}</style>
      <div className="w-full max-w-7xl mx-auto p-4 md:p-8 bg-background text-cyan-400 font-body">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-headline tracking-widest uppercase" style={{ textShadow: '0 0 10px #00e5ff, 0 0 20px #00e5ff' }}>Text To Handwriting</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Main Preview Area */}
            <div className="lg:col-span-8">
                 <div className="relative border-2 border-cyan-400/50 p-1 bg-black" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}>
                    <div className="w-full aspect-[210/297] rounded-sm overflow-hidden relative bg-background p-8">
                       {(paperStyle === 'blue-line' || paperStyle === 'plain') && (
                           <div className="absolute top-8 left-12 bottom-8 w-px bg-red-500/70 pointer-events-none z-0"></div>
                       )}
                       <div className="relative w-full h-full">
                           {(paperStyle === 'gray-line' || paperStyle === 'blue-line') && (
                               <div className="absolute inset-0 pointer-events-none z-0">
                                   {Array.from({ length: 40 }).map((_, i) => (
                                       <div 
                                           key={i} 
                                           className="h-px"
                                           style={{
                                               backgroundColor: paperStyle === 'gray-line' ? 'rgba(100, 100, 100, 0.5)' : 'rgba(0, 100, 255, 0.3)',
                                               marginTop: `${fontSize * 1.5}px`
                                           }}
                                       />
                                   ))}
                               </div>
                           )}
                           <Textarea 
                               className="absolute inset-0 w-full h-full bg-transparent border-0 resize-none z-10 p-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                               value={text}
                               onChange={(e) => setText(e.target.value)}
                               style={{
                                   fontFamily: font,
                                   fontSize: `${fontSize}px`,
                                   color: fontColor,
                                   lineHeight: 1.5,
                                   textShadow: `0 0 3px ${fontColor}80`,
                               }}
                           />
                       </div>
                    </div>
                </div>
            </div>

            {/* Controls Sidebar */}
            <div className="lg:col-span-4 space-y-4">
                {/* Text Input */}
                <div className="relative border border-cyan-400/30 p-4 bg-black/50" style={{ clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)' }}>
                    <div className="absolute top-1 right-4 text-xs uppercase font-headline text-cyan-400/70">Source Text</div>
                    <Textarea 
                      value={text} 
                      onChange={(e) => setText(e.target.value)}
                      rows={5}
                      placeholder="Enter your text here..."
                      className="bg-transparent border-0 text-cyan-300 placeholder:text-cyan-700 focus:ring-0 p-0"
                    />
                </div>
                
                {/* Font and Style Controls */}
                 <div className="relative border border-cyan-400/30 p-4 bg-black/50 space-y-4" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 15px 100%, 0 calc(100% - 15px))' }}>
                    <div className="absolute top-1 left-4 text-xs uppercase font-headline text-cyan-400/70">Styling Matrix</div>
                    <div className="pt-4 grid grid-cols-2 gap-4">
                         <div>
                            <Label className="text-xs text-cyan-400/70">Font Size</Label>
                            <Slider value={[fontSize]} onValueChange={(v) => setFontSize(v[0])} min={12} max={48} step={1} className="[&>span>span]:bg-cyan-400 [&>span]:bg-cyan-400/20"/>
                        </div>
                        <div>
                            <Label className="text-xs text-cyan-400/70">Ink Color</Label>
                            <Input id="font-color" type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="h-10 p-1 w-full bg-transparent border-cyan-400/30"/>
                        </div>
                    </div>
                     <div>
                        <Label className="text-xs text-cyan-400/70">Paper Style</Label>
                         <div className="grid grid-cols-4 gap-2 mt-2">
                            {papers.map(p => {
                                const Icon = p.icon;
                                return (
                                    <div
                                        key={p.id}
                                        className={cn(
                                            "border border-cyan-400/30 flex flex-col items-center justify-center text-center p-2 cursor-pointer aspect-square transition-all",
                                            paperStyle === p.id ? 'bg-cyan-400/20 border-cyan-400' : 'hover:bg-cyan-400/10'
                                        )}
                                        onClick={() => setPaperStyle(p.id)}
                                        style={{ clipPath: 'polygon(0 10px, 10px 0, 100% 0, 100% 100%, 0 100%)' }}
                                    >
                                        <Icon className={cn("h-4 w-4 mb-1", p.color)} />
                                        <p className="text-xs font-medium truncate w-full">{p.name}</p>
                                    </div>
                                )
                            })}
                        </div>
                     </div>
                </div>

                {/* Font Selector */}
                <div className="relative border border-cyan-400/30 p-4 bg-black/50" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}>
                   <div className="absolute top-1 right-4 text-xs uppercase font-headline text-cyan-400/70">Font Selection</div>
                    <div className="h-64 overflow-y-auto space-y-1 pr-2 pt-4">
                        {fonts.map(f => (
                           <div key={f.name} className="flex items-center">
                             <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start text-left h-auto py-1.5 transition-all",
                                    font === f.family ? "bg-cyan-400/20 text-cyan-300" : "text-cyan-400/80 hover:bg-cyan-400/10 hover:text-cyan-300"
                                )}
                                style={{ fontFamily: f.family }}
                                onClick={() => setFont(f.family)}
                             >
                                 {f.name}
                             </Button>
                             <Button size="icon" variant="ghost" className="h-7 w-7 text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-400/10" onClick={() => handleDownload('this-page-pdf', f.family)}>
                               <Download className="h-4 w-4" />
                             </Button>
                           </div>
                        ))}
                    </div>
                </div>

                {/* Download Button */}
                <Button onClick={() => handleDownload('all-pages-pdf')} disabled={isProcessing} size="lg" className="w-full h-16 bg-cyan-400/90 text-black font-bold text-lg tracking-widest font-headline hover:bg-cyan-300 hover:shadow-[0_0_20px_#00e5ff]">
                    {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5"/>}
                    GENERATE & DOWNLOAD
                </Button>
            </div>
        </div>
      </div>
    </>
  );
}
