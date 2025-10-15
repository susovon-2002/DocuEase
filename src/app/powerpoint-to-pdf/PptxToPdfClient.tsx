'use client';

import { useState, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFImage } from 'pdf-lib';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Wand2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

type ConvertStep = 'upload' | 'preview' | 'download';

interface ExtractedSlide {
  texts: { text: string; x: number; y: number; width: number; height: number }[];
  images: { data: string; x: number; y: number; width: number; height: number; type: 'png' | 'jpeg' }[];
  slideNumber: number;
}

export function PptxToPdfClient() {
  const [step, setStep] = useState<ConvertStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [extractedSlides, setExtractedSlides] = useState<ExtractedSlide[]>([]);
  
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelectClick = () => fileInputRef.current?.click();
  
  const EMU_TO_POINTS = 1 / 12700;

  const extractDataFromPptx = async (file: File): Promise<ExtractedSlide[]> => {
    const zip = await JSZip.loadAsync(file);
    const presPropsXml = await zip.file('ppt/presentation.xml')?.async('string');
    if (!presPropsXml) throw new Error('presentation.xml not found.');

    const parser = new DOMParser();
    const presPropsDoc = parser.parseFromString(presPropsXml, 'application/xml');
    const slideSizeCx = parseInt(presPropsDoc.getElementsByTagName('p:sldSz')[0].getAttribute('cx') || '0');
    const slideSizeCy = parseInt(presPropsDoc.getElementsByTagName('p:sldSz')[0].getAttribute('cy') || '0');
    
    const slideWidth = slideSizeCx * EMU_TO_POINTS;
    const slideHeight = slideSizeCy * EMU_TO_POINTS;

    const slides: ExtractedSlide[] = [];
    const slideFiles = Object.keys(zip.files).filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/)).sort();
    
    for (let i = 0; i < slideFiles.length; i++) {
        const slideNumber = i + 1;
        setProcessingMessage(`Processing slide ${slideNumber} of ${slideFiles.length}`);
        
        const slideXml = await zip.file(slideFiles[i])?.async('string');
        if (!slideXml) continue;

        const relsXml = await zip.file(`ppt/slides/_rels/slide${slideNumber}.xml.rels`)?.async('string');
        const relsDoc = relsXml ? parser.parseFromString(relsXml, 'application/xml') : null;
        const relationships: Record<string, string> = {};
        if (relsDoc) {
          Array.from(relsDoc.getElementsByTagName('Relationship')).forEach(rel => {
            const id = rel.getAttribute('Id');
            const target = rel.getAttribute('Target');
            if (id && target) {
              relationships[id] = `ppt/${target.replace('../', '')}`;
            }
          });
        }
        
        const slideDoc = parser.parseFromString(slideXml, "application/xml");
        const shapeTree = slideDoc.getElementsByTagName('p:spTree')[0];
        
        const extractedTexts: ExtractedSlide['texts'] = [];
        const extractedImages: ExtractedSlide['images'] = [];

        // Extract Images
        const picElements = Array.from(shapeTree.getElementsByTagName('p:pic'));
        for (const pic of picElements) {
          const blip = pic.getElementsByTagName('a:blip')[0];
          const embedId = blip?.getAttribute('r:embed');
          const imagePath = embedId ? relationships[embedId] : null;

          if (imagePath) {
            const imageFile = zip.file(imagePath);
            if (imageFile) {
              const imageData = await imageFile.async('base64');
              const imageType = imagePath.endsWith('.png') ? 'png' : 'jpeg';
              
              const xfrm = pic.getElementsByTagName('a:xfrm')[0];
              const off = xfrm?.getElementsByTagName('a:off')[0];
              const ext = xfrm?.getElementsByTagName('a:ext')[0];
              
              if (off && ext) {
                const x = (parseInt(off.getAttribute('x') || '0')) * EMU_TO_POINTS;
                const y = (parseInt(off.getAttribute('y') || '0')) * EMU_TO_POINTS;
                const width = (parseInt(ext.getAttribute('cx') || '0')) * EMU_TO_POINTS;
                const height = (parseInt(ext.getAttribute('cy') || '0')) * EMU_TO_POINTS;
                
                extractedImages.push({
                  data: imageData,
                  x, y, width, height, type: imageType
                });
              }
            }
          }
        }

        // Extract Text
        const spElements = Array.from(shapeTree.getElementsByTagName('p:sp'));
        for(const sp of spElements) {
          const txBody = sp.getElementsByTagName('a:txBody')[0];
          if (txBody) {
             const xfrm = sp.getElementsByTagName('a:xfrm')[0];
             const off = xfrm?.getElementsByTagName('a:off')[0];
             const ext = xfrm?.getElementsByTagName('a:ext')[0];
             
             if (off && ext) {
                const x = (parseInt(off.getAttribute('x') || '0')) * EMU_TO_POINTS;
                const y = (parseInt(off.getAttribute('y') || '0')) * EMU_TO_POINTS;
                const width = (parseInt(ext.getAttribute('cx') || '0')) * EMU_TO_POINTS;
                const height = (parseInt(ext.getAttribute('cy') || '0')) * EMU_TO_POINTS;
                
                let fullText = '';
                const pElements = Array.from(txBody.getElementsByTagName('a:p'));
                for (const p of pElements) {
                   const tElements = Array.from(p.getElementsByTagName('a:t'));
                   fullText += tElements.map(t => t.textContent).join('') + '\n';
                }

                if (fullText.trim()) {
                  extractedTexts.push({ text: fullText.trim(), x, y, width, height });
                }
             }
          }
        }
        
        slides.push({ texts: extractedTexts, images: extractedImages, slideNumber });
    }
    
    return slides;
  };

 const createPdfFromExtractedData = async (slides: ExtractedSlide[]) => {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    for (let i = 0; i < slides.length; i++) {
        setProcessingMessage(`Generating PDF page ${i + 1} of ${slides.length}`);
        const slide = slides[i];
        
        // Use default A4 size as a fallback, but pptx should provide dimensions.
        const slideWidth = slide.images[0]?.width || 595.28; // A4 width in points
        const slideHeight = slide.images[0]?.height || 841.89; // A4 height in points

        const page = pdfDoc.addPage([slideWidth, slideHeight]);
        
        for (const image of slide.images) {
            let embeddedImage: PDFImage;
            const imageBytes = Uint8Array.from(atob(image.data), c => c.charCodeAt(0));
            if (image.type === 'png') {
                embeddedImage = await pdfDoc.embedPng(imageBytes);
            } else {
                embeddedImage = await pdfDoc.embedJpg(imageBytes);
            }
            page.drawImage(embeddedImage, {
                x: image.x,
                y: page.getHeight() - image.y - image.height,
                width: image.width,
                height: image.height,
            });
        }
        
        for (const text of slide.texts) {
            // Simplified text drawing, does not handle overflow or complex styles
            page.drawText(text.text, {
                x: text.x,
                y: page.getHeight() - text.y - 12, // Approximate vertical alignment
                font,
                size: 10,
                color: rgb(0, 0, 0),
                maxWidth: text.width,
                lineHeight: 12,
            });
        }
    }
    
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  };


  const handleFileUpload = async (file: File | null) => {
    if (file) {
      if (file.type !== 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        toast({
            variant: 'destructive',
            title: 'Invalid file type',
            description: 'Please upload a .pptx file.',
        });
        return;
      }

      setOriginalFile(file);
      setIsProcessing(true);
      
      try {
        const slideData = await extractDataFromPptx(file);
        
        if (slideData.every(s => s.texts.length === 0 && s.images.length === 0)) {
             toast({
              title: 'Empty Presentation',
              description: 'No text or images were found. The output may be an empty PDF.',
            });
        }
        
        setExtractedSlides(slideData);
        setStep('preview');
        if (slideData.length > 0) {
          toast({ title: 'Content Extracted', description: `Review the content from your presentation.` });
        }
      } catch(e) {
          console.error(e);
          toast({ variant: 'destructive', title: 'Extraction Failed', description: e instanceof Error ? e.message : 'Could not read the content of the PowerPoint file.' });
          handleStartOver();
      } finally {
          setIsProcessing(false);
      }
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    handleFileUpload(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files ? event.dataTransfer.files[0] : null;
    handleFileUpload(file);
  };
  
  const handleConvert = async () => {
    if (!originalFile) return;
    
    setIsProcessing(true);
    setProcessingMessage('Creating PDF...');

    try {
        const pdfBlob = await createPdfFromExtractedData(extractedSlides);
        
        setOutputFile({ 
            name: originalFile.name.replace(/\.pptx$/i, '.pdf'),
            blob: pdfBlob
        });
        setStep('download');
        toast({ title: 'Conversion Complete!', description: 'Your PowerPoint has been converted to a PDF.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not convert the file.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setStep('upload');
    setOriginalFile(null);
    setOutputFile(null);
    setExtractedSlides([]);
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
  
  const getCombinedTextPreview = () => {
    return extractedSlides.map(slide => 
      `--- Slide ${slide.slideNumber} ---\n` + slide.texts.map(t => t.text).join('\n')
    ).join('\n\n');
  }

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
            <h1 className="text-3xl font-bold">PowerPoint to PDF</h1>
            <p className="text-muted-foreground mt-2">Convert your .pptx presentations to PDF documents.</p>
          </div>
          <Card className="border-2 border-dashed" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
            <CardContent className="p-10 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="bg-secondary p-4 rounded-full">
                  <UploadCloud className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">Drag & drop a .pptx file here</p>
                <p className="text-muted-foreground">or</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                />
                <Button size="lg" onClick={handleFileSelectClick}>Select File</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    
    case 'preview':
        const textPreview = getCombinedTextPreview();
        return (
             <div className="w-full max-w-4xl mx-auto text-center">
                 <div className="mb-8">
                    <h1 className="text-3xl font-bold">Review Extracted Content</h1>
                    <p className="text-muted-foreground mt-2">This is the text content found in your presentation. Images are also extracted but not shown here. Proceed to create the PDF.</p>
                </div>
                <Card className="mb-8">
                    <CardContent className="p-4">
                        <Textarea
                            readOnly
                            value={textPreview}
                            className="w-full h-96 rounded-md border bg-muted p-4 text-base font-body"
                            placeholder="No text was found in the presentation. The output may only contain images."
                        />
                    </CardContent>
                </Card>
                 <div className="flex justify-center gap-4">
                    <Button onClick={handleStartOver} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <Button onClick={handleConvert} size="lg">
                        <Wand2 className="mr-2 h-4 w-4" />
                        Create PDF
                    </Button>
                </div>
            </div>
        );

    case 'download':
        return (
            <div className="w-full max-w-4xl mx-auto text-center">
                 <div className="mb-8">
                    <h1 className="text-3xl font-bold">Conversion Complete</h1>
                    <p className="text-muted-foreground mt-2">Your presentation has been converted into a PDF.</p>
                </div>
                <Card className="mb-8">
                    <CardContent className="p-2">
                        {outputFile && <iframe src={URL.createObjectURL(outputFile.blob)} className="w-full h-[70vh] border-0" title="Generated PDF Preview" />}
                    </CardContent>
                </Card>
                <div className="flex justify-center gap-4">
                    <Button onClick={handleStartOver} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Convert Another
                    </Button>
                    <Button onClick={handleDownloadFile} size="lg">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                </div>
                 <p className="text-xs text-muted-foreground mt-4">Note: This is a direct conversion. Complex layouts and animations may not be preserved.</p>
            </div>
        )
  }
}
