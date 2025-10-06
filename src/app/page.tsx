import { tools } from '@/lib/tools';
import ToolCard from '@/components/ToolCard';
import { groupBy } from 'lodash';
import VideoPlayer from '@/components/VideoPlayer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { Tv } from 'lucide-react';

export default function Home() {
  const groupedTools = groupBy(tools, 'category');
  const categoryOrder = [
    'Organize PDF',
    'Optimize PDF',
    'Convert to PDF',
    'Convert from PDF',
    'Edit PDF',
    'PDF Security',
    'AI Tools',
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
          The All-in-One PDF Toolkit
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Effortlessly convert, compress, merge, edit, and secure your documents. Simple, fast, and reliable.
        </p>
      </header>

      <div className="space-y-12">
        {categoryOrder.map((category) => {
          const categoryTools = groupedTools[category];
          if (!categoryTools) return null;

          return (
            <section key={category}>
              <h2 className="text-2xl font-semibold border-b pb-2 mb-6">
                {category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categoryTools.map((tool) => (
                  <ToolCard key={tool.path} tool={tool} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
      
      <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm">
        <Accordion type="single" collapsible>
          <AccordionItem value="entertainment" className="border-none">
             <Card className="shadow-2xl rounded-lg">
                <AccordionTrigger className="w-full p-4 rounded-t-lg bg-background hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Tv className="w-5 h-5" />
                    <h2 className="text-lg font-semibold">
                      Entertainment
                    </h2>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <VideoPlayer />
                </AccordionContent>
             </Card>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
