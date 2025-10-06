'use client';

import { UploadCloud, File as FileIcon, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useRef, useState } from 'react';
import { Badge } from './ui/badge';

interface FileUploadPlaceholderProps {
  title: string;
  description: string;
  onUpload?: (files: File[]) => void;
  uploadButton?: React.ReactNode;
}

export function FileUploadPlaceholder({
  title,
  description,
  onUpload,
  uploadButton,
}: FileUploadPlaceholderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles((prevFiles) => [...prevFiles, ...Array.from(files)]);
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

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      setSelectedFiles((prevFiles) => [...prevFiles, ...Array.from(files)]);
    }
  };

  const handleUploadClick = () => {
    if (onUpload && selectedFiles.length > 0) {
      onUpload(selectedFiles);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>
      <Card className="border-2 border-dashed" onDragOver={handleDragOver} onDrop={handleDrop}>
        <CardContent className="p-10 text-center">
          {selectedFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="bg-secondary p-4 rounded-full">
                <UploadCloud className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">Drag & drop files here</p>
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
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{Math.round(file.size / 1024)} KB</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveFile(index)}
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
                {uploadButton ? (
                   <div onClick={handleUploadClick}>{uploadButton}</div>
                ) : (
                  <Button onClick={handleUploadClick}>Upload</Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
