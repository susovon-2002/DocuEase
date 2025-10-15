'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, File, ArrowRight } from 'lucide-react';

export function HtmlToPdfClient() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">HTML to PDF</h1>
        <p className="text-muted-foreground mt-2">The best way to convert an HTML page to a PDF is by using your browser’s built-in Print function.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How to Convert a Webpage to PDF</CardTitle>
          <CardDescription>
            This method works on any website and provides the highest quality conversion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 flex flex-col items-center gap-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</div>
              <div className="h-6 w-px bg-border"></div>
            </div>
            <div>
              <h3 className="font-semibold">Open the Webpage</h3>
              <p className="text-muted-foreground">Navigate to the webpage you want to convert in Chrome, Firefox, Safari, or Edge.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 flex flex-col items-center gap-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">2</div>
               <div className="h-6 w-px bg-border"></div>
            </div>
            <div>
              <h3 className="font-semibold">Open the Print Menu</h3>
              <p className="text-muted-foreground">Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Ctrl+P</kbd> on Windows or <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Cmd+P</kbd> on Mac. You can also find "Print" in your browser's menu.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
             <div className="flex-shrink-0 flex flex-col items-center gap-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">3</div>
            </div>
            <div>
              <h3 className="font-semibold">Change the Destination to PDF</h3>
              <p className="text-muted-foreground">In the print preview window, find the "Destination" or "Printer" dropdown and select "Save as PDF".</p>
            </div>
          </div>
            <div className="flex items-start gap-4">
             <div className="flex-shrink-0 flex flex-col items-center gap-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">4</div>
            </div>
            <div>
              <h3 className="font-semibold">Save</h3>
              <p className="text-muted-foreground">Click the "Save" button and choose where to save your new PDF file.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
