
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ToolAuthWrapper } from "@/components/ToolAuthWrapper";
import { Printer, MousePointerClick, FileDown } from "lucide-react";

function HtmlToPdfContent() {
    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold">HTML to PDF</h1>
                <p className="text-muted-foreground mt-2">The best way to convert a web page to a high-quality PDF is by using your browser's built-in print function.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>How to Convert a Web Page to PDF</CardTitle>
                    <CardDescription>Follow these simple steps for a perfect conversion.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-2xl flex-shrink-0">1</div>
                        <div>
                            <h3 className="font-semibold">Open the Web Page</h3>
                            <p className="text-muted-foreground">Navigate to the web page you want to convert to a PDF in your browser (Chrome, Firefox, Safari, Edge).</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-2xl flex-shrink-0">2</div>
                        <div>
                            <h3 className="font-semibold">Open the Print Dialog</h3>
                            <p className="text-muted-foreground">Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Ctrl+P</kbd> (on Windows/Linux) or <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Cmd+P</kbd> (on Mac) to open the print dialog.</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center rounded-full bg-primary/10 text-primary p-3 flex-shrink-0">
                            <Printer className="w-6 h-6"/>
                        </div>
                        <div>
                            <h3 className="font-semibold">Change the Destination</h3>
                            <p className="text-muted-foreground">In the print dialog, find the "Destination" or "Printer" setting and change it to <span className="font-semibold">"Save as PDF"</span>.</p>
                        </div>
                    </div>
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center rounded-full bg-primary/10 text-primary p-3 flex-shrink-0">
                            <FileDown className="w-6 h-6"/>
                        </div>
                        <div>
                            <h3 className="font-semibold">Save the File</h3>
                            <p className="text-muted-foreground">Click the "Save" button. You will be prompted to choose a location on your computer to save the final PDF file.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="text-center mt-8">
                <p className="text-sm text-muted-foreground">This method ensures the highest fidelity conversion by using your browser's rendering engine.</p>
            </div>
        </div>
    );
}


export default function HtmlToPdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <HtmlToPdfContent />
      </div>
    </ToolAuthWrapper>
  );
}
