'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles, UploadCloud, Download, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { handleExtractTables } from './actions';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  pdfFile: z
    .any()
    .refine((files) => files?.length === 1, 'PDF file is required.')
    .refine((files) => files?.[0]?.type === 'application/pdf', 'Only PDF files are accepted.')
    .refine((files) => files?.[0]?.size <= 10 * 1024 * 1024, 'File size must be less than 10MB.'),
});

type FormValues = z.infer<typeof formSchema>;

export function PdfToExcelClient() {
  const [step, setStep] = useState<'upload' | 'download'>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [fileName, setFileName] = useState('');
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setCsvData('');

    const file = data.pdfFile[0];
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = async () => {
      const pdfDataUri = reader.result as string;
      try {
        const result = await handleExtractTables({ pdfDataUri });

        if (result.error) {
          throw new Error(result.error);
        }

        if (!result.csv || result.csv.trim() === '') {
          throw new Error('No tables were found in the document.');
        }

        setCsvData(result.csv || '');
        setStep('download');
        toast({
          title: 'Tables Extracted!',
          description: 'Your data is ready to be downloaded as an Excel file.',
        });

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'An error occurred',
          description: error instanceof Error ? error.message : 'Please try again later.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      toast({
        variant: 'destructive',
        title: 'File Reading Error',
        description: 'Could not read the selected file.',
      });
      setIsLoading(false);
    };
  };

  const handleDownloadExcel = () => {
    if (!csvData) return;
    
    // The AI might return multiple CSVs separated by newlines.
    // We'll put each one in a separate sheet.
    const csvBlobs = csvData.split(/\n\n\n*/);
    
    const wb = XLSX.utils.book_new();

    csvBlobs.forEach((csv, index) => {
      if (csv.trim() === '') return;
      const ws = XLSX.utils.csv_to_sheet(csv);
      XLSX.utils.book_append_sheet(wb, ws, `Sheet${index + 1}`);
    });
    
    const excelFileName = `${fileName.replace('.pdf', '')}_data.xlsx`;
    
    XLSX.writeFile(wb, excelFileName);
  }
  
  const handleStartOver = () => {
    setStep('upload');
    setCsvData('');
    setFileName('');
    form.reset();
  }

  if (step === 'download') {
    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold">Extraction Complete</h1>
                <p className="text-muted-foreground mt-2">Your table data has been extracted. Download the Excel file to open it.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Extracted Data Preview</CardTitle>
                    <CardDescription>
                        This is a preview of the data extracted from your PDF. Download it to open in Excel.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea 
                        readOnly 
                        value={csvData} 
                        className="w-full h-80 font-mono text-xs bg-muted"
                    />
                </CardContent>
            </Card>
            <div className="flex justify-center gap-4 mt-8">
                 <Button onClick={handleStartOver} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Convert Another File
                </Button>
                <Button onClick={handleDownloadExcel} size="lg">
                    <Download className="mr-2 h-4 w-4" />
                    Download Excel (.xlsx)
                </Button>
            </div>
        </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">PDF to Excel</h1>
        <p className="text-muted-foreground mt-2">
          Use AI to extract tables from your PDF and convert them into a structured Excel file.
        </p>
      </div>
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Upload Your PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="pdfFile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="relative flex items-center w-full h-32 rounded-md border-2 border-dashed bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent/50 transition-colors font-normal group justify-center flex-col gap-2">
                       <div className="bg-secondary p-3 rounded-full border">
                         <UploadCloud className="w-8 h-8 text-muted-foreground transition-colors group-hover:text-accent-foreground" />
                       </div>
                      <span className="text-muted-foreground flex-1 truncate transition-colors group-hover:text-accent-foreground text-base">
                        {fileName || "Select a PDF file to process"}
                      </span>
                       <p className="text-xs text-muted-foreground">Max file size 10MB</p>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="application/pdf"
                        className="sr-only"
                        ref={field.ref}
                        onBlur={field.onBlur}
                        name={field.name}
                        onChange={(e) => {
                          field.onChange(e.target.files);
                          setFileName(e.target.files?.[0]?.name || '');
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading || !fileName} size="lg" className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting Tables...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Extract and Convert
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}