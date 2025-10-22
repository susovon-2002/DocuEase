
'use client';

import { useState } from 'react';
import { tools } from '@/lib/tools';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Combine, Minimize2, FileImage, FilePenLine, Lock, Sparkles, LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { groupBy } from 'lodash';
import ToolCard from '@/components/ToolCard';


const popularToolPaths = [
  '/merge-pdf',
  '/compress-pdf',
  '/split-pdf',
  '/pdf-to-word',
  '/sign-pdf',
];


export default function Home() {
  const [showAllTools, setShowAllTools] = useState(false);
  const toolsByCategory = groupBy(tools, 'category');
  const popularTools = tools.filter(tool => popularToolPaths.includes(tool.path));

  const categoryIcons: Record<string, LucideIcon> = {
    'Organize PDF': Combine,
    'Optimize PDF': Minimize2,
    'Convert to PDF': FileImage,
    'Convert from PDF': FileImage,
    'Edit PDF': FilePenLine,
    'PDF Security': Lock,
  };


  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-12">
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-primary/20 blur-3xl rounded-full"></div>
                 <img src="https://picsum.photos/seed/ai-face/800/800" alt="AI" className="relative w-full h-auto" data-ai-hint="abstract technology" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
                We are FLUX
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10">
                Our AI solutions are designed to streamline your workflow and boost productivity.
              </p>
              <Button asChild size="lg">
                  <Link href="#all-tools">Find Out More <ArrowRight className="ml-2" /></Link>
              </Button>
            </div>
        </div>
      </section>

      {/* All Tools Section */}
      <section className="py-20 bg-secondary/50" id="all-tools">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Our Suite of Tools</h2>
             <p className="text-muted-foreground mt-2">Everything you need to be more productive and work smarter with documents.</p>
          </div>
          
           {!showAllTools ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {popularTools.map(tool => <ToolCard key={tool.path} tool={tool} />)}
              </div>
              <div className="text-center mt-12">
                <Button onClick={() => setShowAllTools(true)} size="lg" variant="outline">View All Tools</Button>
              </div>
            </>
           ) : (
            <>
              <div className="space-y-12">
                  {Object.entries(toolsByCategory).map(([category, categoryTools]) => {
                    const CategoryIcon = categoryIcons[category] || FilePenLine;
                    return (
                      <div key={category}>
                        <h3 className="text-2xl font-semibold mb-6 flex items-center">
                          <CategoryIcon className="h-8 w-8 mr-4 text-primary" />
                          {category}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                           {categoryTools.map(tool => <ToolCard key={tool.path} tool={tool} />)}
                        </div>
                      </div>
                    )
                  })}
              </div>
               <div className="text-center mt-16">
                <Button onClick={() => setShowAllTools(false)} size="lg" variant="outline">Show Less</Button>
              </div>
            </>
           )}
        </div>
      </section>
    </div>
  );
}
