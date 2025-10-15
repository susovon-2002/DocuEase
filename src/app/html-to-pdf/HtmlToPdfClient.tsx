'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Link as LinkIcon, Download, RefreshCw, ArrowLeft, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Step = 'input' | 'download';

export function HtmlToPdfClient() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [outputFile, setOutputFile] = useState<{ name: string; blob: Blob } | null>(null);
  const [step, setStep] = useState<Step>('input');
  const { toast } = useToast();

  const handleConvert = async () => {
    if (!url || !url.startsWith('http')) {
      toast({
        variant: 'destructive',
        title: 'Invalid URL',
        description: 'Please enter a valid URL starting with http:// or https://',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/html-to-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to convert the URL to PDF.');
      }

      const blob = await response.blob();
      setOutputFile({ name: 'converted_page.pdf', blob });
      setStep('download');
      toast({
        title: 'Conversion Successful!',
        description: 'The webpage has been converted to a PDF.',
      });

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Conversion Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadFile = () => {
    if (!outputFile) return;
    const downloadUrl = URL.createObjectURL(outputFile.blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = outputFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  };
  
  const handleStartOver = () => {
      setStep('input');
      setUrl('');
      setOutputFile(null);
  }

  if (step === 'download' && outputFile) {
      return (
        <div className="w-full max-w-4xl mx-auto text-center">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Conversion Complete</h1>
                <p className="text-muted-foreground mt-2">Your PDF is ready for preview and download.</p>
            </div>
            <Card className="mb-8">
                <CardContent className="p-2">
                    <iframe src={URL.createObjectURL(outputFile.blob)} className="w-full h-[70vh] border-0" title="PDF Preview" />
                </CardContent>
            </Card>
            <div className="flex justify-center gap-4">
                <Button onClick={handleStartOver} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Convert Another URL
                </Button>
                <Button onClick={handleDownloadFile} size="lg">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                </Button>
            </div>
        </div>
      );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">HTML to PDF</h1>
        <p className="text-muted-foreground mt-2">Enter the URL of a webpage to convert it to a PDF document.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Enter Webpage URL</CardTitle>
          <CardDescription>
            This tool will fetch the HTML from the URL and convert it. Note: Complex layouts, styles, and images may not be perfectly rendered.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-muted-foreground" />
            <Input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardContent>
          <Button onClick={handleConvert} disabled={isLoading || !url} className="w-full" size="lg">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Convert to PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
