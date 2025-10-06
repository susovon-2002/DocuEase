'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles, UploadCloud } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { handleSummarizePdf } from './actions';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  pdfFile: z
    .any()
    .refine((files) => files?.length === 1, 'PDF file is required.')
    .refine((files) => files?.[0]?.type === 'application/pdf', 'Only PDF files are accepted.')
    .refine((files) => files?.[0]?.size <= 5 * 1024 * 1024, 'File size must be less than 5MB.'),
  length: z.enum(['short', 'medium', 'long'], {
    required_error: 'You need to select a summary length.',
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function SummarizeForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [fileName, setFileName] = useState('');
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      length: 'medium',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setSummary('');

    const file = data.pdfFile[0];
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = async () => {
      const pdfDataUri = reader.result as string;
      try {
        const result = await handleSummarizePdf({
          pdfDataUri,
          length: data.length,
        });

        if (result.error) {
          throw new Error(result.error);
        }

        setSummary(result.summary || '');
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

  return (
    <>
      <Card>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Upload Your Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="pdfFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="relative flex items-center w-full h-12 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent/50 transition-colors font-normal group">
                    <UploadCloud className="w-5 h-5 mr-3 text-muted-foreground transition-colors group-hover:text-accent-foreground" />
                    <span className="text-muted-foreground flex-1 truncate transition-colors group-hover:text-accent-foreground">
                      {fileName || "Select a PDF file (max 5MB)"}
                    </span>
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

            <FormField
              control={form.control}
              name="length"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Summary Length</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="short" />
                        </FormControl>
                        <FormLabel className="font-normal">Short</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="medium" />
                        </FormControl>
                        <FormLabel className="font-normal">Medium</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="long" />
                        </FormControl>
                        <FormLabel className="font-normal">Long</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Summarizing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Summary
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {summary && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Generated Summary</h2>
          <Card>
            <CardContent className="p-6">
              <Textarea
                readOnly
                value={summary}
                className="w-full h-64 text-base bg-secondary border-none"
                placeholder="Your summary will appear here."
              />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
