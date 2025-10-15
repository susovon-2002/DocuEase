'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileCode, Printer } from 'lucide-react';

export function HtmlToPdfClient() {

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">HTML to PDF</h1>
        <p className="text-muted-foreground mt-2">The best way to convert a webpage to a high-quality PDF is to use your browser's built-in print function.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>How to Convert a Webpage to PDF</CardTitle>
          <CardDescription>
            Follow these simple steps on any modern browser like Chrome, Firefox, Edge, or Safari.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">1</div>
                <div>
                    <h3 className="font-semibold">Open the Webpage</h3>
                    <p className="text-muted-foreground">Navigate to the URL you want to convert to a PDF.</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">2</div>
                <div>
                    <h3 className="font-semibold">Open the Print Dialog</h3>
                    <p className="text-muted-foreground">Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Ctrl+P</kbd> (on Windows/Linux) or <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Cmd+P</kbd> (on Mac).</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">3</div>
                <div>
                    <h3 className="font-semibold">Change the Destination</h3>
                    <p className="text-muted-foreground">In the print preview window, find the "Destination" or "Printer" dropdown menu and select <strong>"Save as PDF"</strong>.</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">4</div>
                <div>
                    <h3 className="font-semibold">Save Your PDF</h3>
                    <p className="text-muted-foreground">Adjust any settings like layout or margins if needed, then click the "Save" button to create your PDF.</p>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
