'use client';

import { UploadCloud } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface FileUploadPlaceholderProps {
  title: string;
  description: string;
}

export function FileUploadPlaceholder({ title, description }: FileUploadPlaceholderProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>
      <Card className="border-2 border-dashed">
        <CardContent className="p-10 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="bg-secondary p-4 rounded-full">
              <UploadCloud className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">Drag & drop files here</p>
            <p className="text-muted-foreground">or</p>
            <Button size="lg">
              Select Files
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Maximum file size 2GB.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
