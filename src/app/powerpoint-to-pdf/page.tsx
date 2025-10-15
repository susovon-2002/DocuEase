
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePieChart, Printer } from 'lucide-react';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

function PowerPointToPdfContent() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="w-full max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">PowerPoint to PDF</h1>
          <p className="text-muted-foreground mt-2">Information on converting PowerPoint files to PDF.</p>
        </div>
        <Card className="border-blue-200 bg-blue-50/30 dark:border-blue-900 dark:bg-blue-950/30">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
                <FilePieChart className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <CardTitle className="text-blue-800 dark:text-blue-200">Feature Announcement</CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Direct PowerPoint to PDF conversion is a complex process that requires server-side processing to maintain high fidelity.
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none text-center mx-auto">
            <p>
              To ensure the best quality and preserve your presentation's exact formatting, we recommend using your presentation software's built-in "Print to PDF" or "Save as PDF" feature.
            </p>
            <div className="p-4 mt-4 rounded-md bg-background border">
                <h4 className="font-semibold flex items-center justify-center"><Printer className="mr-2 h-4 w-4"/>Recommended Method</h4>
                <ol className="list-decimal list-inside text-left mt-2 pl-4">
                    <li>Open your presentation in Microsoft PowerPoint or Google Slides.</li>
                    <li>Go to <strong>File</strong> &gt; <strong>Print</strong>.</li>
                    <li>Choose <strong>"Microsoft Print to PDF"</strong> or <strong>"Save as PDF"</strong> as the printer.</li>
                    <li>Click <strong>Print</strong> or <strong>Save</strong> to create your PDF file.</li>
                </ol>
            </div>
            <p className="mt-4">
              This method guarantees that all your fonts, images, and layouts look exactly as you designed them.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


export default function PowerpointToPdfPage() {
    return (
        <ToolAuthWrapper>
            <PowerpointToPdfContent />
        </ToolAuthWrapper>
    )
}
