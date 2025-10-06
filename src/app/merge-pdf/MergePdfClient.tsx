'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Loader2, File as FileIcon, X, UploadCloud, GripVertical, Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function MergePdfClient() {
  const [isMerging, setIsMerging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files).filter(file => file.type === 'application/pdf');
      if (newFiles.length !== files.length) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Only PDF files are supported.',
        });
      }
      setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  const handleClearFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };
  
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;

    const newFiles = [...selectedFiles];
    const draggedItem = newFiles.splice(draggedIndex, 1)[0];
    newFiles.splice(index, 0, draggedItem);
    
    setSelectedFiles(newFiles);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files).filter(file => file.type === 'application/pdf');
       if (newFiles.length !== files.length) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Only PDF files are supported for dropping.',
        });
      }
      setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };

  const handleMerge = async () => {
    if (selectedFiles.length < 2) {
      toast({
        variant: 'destructive',
        title: 'Not enough files',
        description: 'Please select at least two PDF files to merge.',
      });
      return;
    }

    setIsMerging(true);
    if(previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }


    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of selectedFiles) {
        const fileBuffer = await file.arrayBuffer();
        try {
          const pdf = await PDFDocument.load(fileBuffer);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => {
            mergedPdf.addPage(page);
          });
        } catch (e) {
            toast({
                variant: 'destructive',
                title: 'Could not process a file',
                description: `${file.name} is not a valid PDF or is corrupted.`,
            });
            setIsMerging(false);
            return;
        }
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      toast({
        title: 'Merge Successful',
        description: 'Your PDF has been merged. You can now preview and download it.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description:
          error instanceof Error ? error.message : 'Could not merge the PDFs. Please try again.',
      });
    } finally {
      setIsMerging(false);
    }
  };

  const handleStartOver = () => {
    if(previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  const handleDownload = () => {
    if(!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = 'merged.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  if (previewUrl) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Preview Your Merged PDF</h1>
            <p className="text-muted-foreground mt-2">Review the document below. If it looks good, download it.</p>
        </div>
        <div className="flex justify-center gap-4 mb-8">
           <Button onClick={handleStartOver} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Start Over
            </Button>
            <Button onClick={handleDownload} size="lg">
              <Download className="mr-2 h-4 w-4" />
              Download Merged PDF
            </Button>
        </div>
        <Card>
          <CardContent className="p-2">
            <iframe src={previewUrl} className="w-full h-[70vh] border-0" title="Merged PDF Preview" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
     <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Merge PDF</h1>
        <p className="text-muted-foreground mt-2">Combine multiple PDF documents into one. Rearrange and organize files as you like.</p>
      </div>
      <Card className="border-2 border-dashed" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
        <CardContent className="p-10 text-center">
          {selectedFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="bg-secondary p-4 rounded-full">
                <UploadCloud className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">Drag & drop PDF files here</p>
              <p className="text-muted-foreground">or</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
                accept="application/pdf"
              />
              <Button size="lg" onClick={handleFileSelectClick}>
                Select Files
              </Button>
              <p className="text-xs text-muted-foreground mt-4">Only PDF files are supported.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Selected Files</h3>
              <p className="text-sm text-muted-foreground">Drag and drop to reorder files.</p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={file.name + index}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md bg-muted/50 cursor-grab",
                      draggedIndex === index && "bg-primary/20 opacity-50"
                    )}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{Math.round(file.size / 1024)} KB</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(index);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <Button onClick={handleClearFiles} variant="outline">
                  <X className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
                 <Button size="lg" disabled={isMerging} onClick={handleMerge}>
                  {isMerging ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Merging...
                    </>
                  ) : (
                    'Merge & Preview'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
