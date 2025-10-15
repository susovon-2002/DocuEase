'use client';

import { useState, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Download, RefreshCw, Wand2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

type ConvertStep = 'upload' | 'preview' | 'download';

export function WordToPdfClient() {
  const [step, setStep] = useState<ConvertStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  const [originalFiles, setOriginalFiles] = useState<File[]>([]);
  const [extractedText, setExtractedText] = useState('');
  
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob, textContent: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelectClick = () => fileInputRef.current?.click();
  
  const extractTextFromDocx = async (file: File): Promise<string> => {
    const zip = await JSZip.loadAsync(file);
    const docXml = await zip.file('word/document.xml')?.async('string');
    if (!docXml) {
      throw new Error(`Could not find document.xml in ${file.name}.`);
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXml, 'application/xml');
    const paragraphs = xmlDoc.getElementsByTagName('w:p');
    let fullText = '';

    for (let i = 0; i < paragraphs.length; i++) {
      const texts = paragraphs[i].getElementsByTagName('w:t');
      let lineText = '';
      for (let j = 0; j < texts.length; j++) {
        lineText += texts[j].textContent;
      }
      fullText += lineText + '\n';
    }
    
    return fullText.trim();
  };

  const createPdfFromText = async (text: string) => {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;
    const margin = 50;
    const maxWidth = width - margin * 2;
    const lineHeight = fontSize * 1.2;

    const textLines = text.split('\n');
    let y = height - margin;

    for (const line of textLines) {
      let currentLine = line;
      while (currentLine.length > 0) {
        if (y < margin) {
          page = pdfDoc.addPage();
          y = page.getHeight() - margin;
        }

        let breakIndex = currentLine.length;
        let lineWidth = font.widthOfTextAtSize(currentLine, fontSize);

        if (lineWidth > maxWidth) {
          let charCount = 0;
          while(charCount < currentLine.length) {
              const nextCharWidth = font.widthOfTextAtSize(currentLine.substring(0, charCount + 1), fontSize);
              if (nextCharWidth > maxWidth) {
                  break;
              }
              charCount++;
          }

          const lastSpace = currentLine.substring(0, charCount).lastIndexOf(' ');
          if(lastSpace > 0) {
              breakIndex = lastSpace;
          } else {
              breakIndex = charCount;
          }
        }
        
        const lineToDraw = currentLine.substring(0, breakIndex);
        page.drawText(lineToDraw, { x: margin, y, font, size: fontSize, color: rgb(0, 0, 0) });
        y -= lineHeight;
        currentLine = currentLine.substring(breakIndex).trim();
      }
    }
    
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  };


  const handleFileUpload = async (files: File[] | null) => {
    if (files && files.length > 0) {
      const docxFiles = files.filter(file => file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      
      if (docxFiles.length !== files.length) {
        toast({
            variant: 'destructive',
            title: 'Invalid file type',
            description: 'One or more selected files were not .docx files and were ignored.',
        });
      }

      if (docxFiles.length === 0) {
        return;
      }

      setOriginalFiles(docxFiles);
      setIsProcessing(true);
      
      let allText = '';
      try {
        for (let i = 0; i < docxFiles.length; i++) {
          const file = docxFiles[i];
          setProcessingMessage(`Extracting text from ${file.name} (${i + 1}/${docxFiles.length})...`);
          const textContent = await extractTextFromDocx(file);
          allText += textContent + '\n\n'; // Add separator between documents
        }

        setExtractedText(allText);
        setStep('preview');
        toast({ title: 'Text Extracted', description: `Review the text from ${docxFiles.length} document(s) and proceed.` });
      } catch(e) {
          console.error(e);
          toast({ variant: 'destructive', title: 'Extraction Failed', description: 'Could not read the content of one or more Word files.' });
          handleStartOver();
      } finally {
          setIsProcessing(false);
      }
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : null;
    handleFileUpload(files);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files ? Array.from(event.dataTransfer.files) : null;
    handleFileUpload(files);
  };
  
  const handleConvert = async () => {
    if (originalFiles.length === 0 || !extractedText) return;
    
    setIsProcessing(true);
    setProcessingMessage('Creating PDF...');

    try {
        const pdfBlob = await createPdfFromText(extractedText);
        
        const outputName = originalFiles.length > 1 ? 'Combined_Document.pdf' : originalFiles[0].name.replace(/\.docx$/i, '.pdf');

        setOutputFile({ 
            name: outputName,
            blob: pdfBlob,
            textContent: extractedText
        });
        setStep('download');
        toast({ title: 'Conversion Complete!', description: 'Your Word document(s) have been converted to a PDF.' });

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not convert the Word file.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setStep('upload');
    setOriginalFiles([]);
    setOutputFile(null);
    setExtractedText('');
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
            <h1 className="text-3xl font-bold">Word to PDF</h1>
            <p className="text-muted-foreground mt-2">Convert your Microsoft Word documents to PDF format with high fidelity.</p>
          </div>
          <Card className="border-2 border-dashed" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
            <CardContent className="p-10 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="bg-secondary p-4 rounded-full">
                  <UploadCloud className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">Drag & drop .docx files here</p>
                <p className="text-muted-foreground">or</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".docx"
                  multiple
                />
                <Button size="lg" onClick={handleFileSelectClick}>Select Files</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    
    case 'preview':
        return (
             <div className="w-full max-w-4xl mx-auto text-center">
                 <div className="mb-8">
                    <h1 className="text-3xl font-bold">Review Extracted Text</h1>
                    <p className="text-muted-foreground mt-2">This is the text content found in your document(s). Proceed to create the PDF.</p>
                </div>
                <Card className="mb-8">
                    <CardContent className="p-4">
                        <Textarea
                            readOnly
                            value={extractedText}
                            className="w-full h-96 rounded-md border bg-muted p-4 text-base font-body"
                            placeholder="Extracted text will appear here."
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
                    <p className="text-muted-foreground mt-2">The text from your Word document(s) has been converted into a PDF.</p>
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
                 <p className="text-xs text-muted-foreground mt-4">Note: This tool converts text content only. Formatting like images, tables, and complex styles may not be preserved.</p>
            </div>
        )
  }
}
