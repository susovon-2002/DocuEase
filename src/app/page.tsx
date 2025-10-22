
'use client';

import { useState } from 'react';
import { tools } from '@/lib/tools';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Combine, Minimize2, FileImage, FilePenLine, Lock, Sparkles, LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { groupBy } from 'lodash';
import ToolCard from '@/components/ToolCard';
import Image from 'next/image';


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
      <section className="py-20 md:py-32 text-center">
        <div className="container mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
              Bring Your Ideas to Life
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Transform your documents with our stunning, professional-quality tools.
              Let our app bring your imagination to life with precision and creativity.
            </p>
            <div className="flex justify-center items-center gap-4">
               <Button asChild size="lg">
                  <Link href="#all-tools">Get Started Now</Link>
              </Button>
            </div>
        </div>
      </section>

      {/* All Tools Section */}
      <section className="py-20 bg-background" id="all-tools">
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
                          <CategoryIcon className="h-6 w-6 mr-3 text-primary" />
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
