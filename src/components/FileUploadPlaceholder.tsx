
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud } from 'lucide-react';

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
      <Card className="border-2 border-dashed bg-muted/50">
        <CardContent className="p-10 text-center">
          <div className="flex flex-col items-center justify-center space-y-4 text-muted-foreground/50">
            <div className="bg-secondary p-4 rounded-full border">
              <UploadCloud className="h-12 w-12" />
            </div>
            <p className="text-lg font-medium">This feature is not yet available.</p>
            <p>Check back soon for updates!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
