

import { tools } from '@/lib/tools';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Combine, Minimize2, FileImage, FilePenLine, Lock, Sparkles, LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { groupBy } from 'lodash';


export default function Home() {
  const toolsByCategory = groupBy(tools, 'category');

  const categoryIcons: Record<string, LucideIcon> = {
    'Organize PDF': Combine,
    'Optimize PDF': Minimize2,
    'Convert to PDF': FileImage,
    'Convert from PDF': FileImage,
    'Edit PDF': FilePenLine,
    'PDF Security': Lock,
    'AI Tools': Sparkles,
  };


  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-secondary/50">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
            The All-in-One PDF Toolkit
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Effortlessly convert, compress, merge, edit, and secure your documents. Simple, fast, and reliable for all your PDF needs.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Get Started for Free <ArrowRight className="ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#all-tools">View All Tools</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
            <p className="text-muted-foreground mt-2">Three simple steps to manage your PDFs.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary font-bold text-2xl mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2">Upload Your File</h3>
              <p className="text-muted-foreground">Select or drag and drop your document into the tool of your choice.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary font-bold text-2xl mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2">Configure and Process</h3>
              <p className="text-muted-foreground">Adjust the settings and let our powerful tools handle the rest.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary font-bold text-2xl mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2">Download Your PDF</h3>
              <p className="text-muted-foreground">Your new document is ready to download in seconds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* All Tools Section */}
      <section className="py-20 bg-secondary/50" id="all-tools">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">All Our Tools</h2>
            <p className="text-muted-foreground mt-2">Everything you need to be more productive and work smarter with documents.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
              {Object.entries(toolsByCategory).map(([category, categoryTools]) => {
                const CategoryIcon = categoryIcons[category] || FilePenLine;
                return (
                  <div key={category}>
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <CategoryIcon className="h-5 w-5 mr-3 text-primary" />
                      {category}
                    </h3>
                    <ul className="space-y-3">
                      {categoryTools.map(tool => {
                        const ToolIcon = tool.icon;
                        return (
                           <li key={tool.path}>
                            <Link href={tool.path} className="flex items-center text-muted-foreground hover:text-primary transition-colors">
                              <ToolIcon className="h-4 w-4 mr-2" />
                              {tool.title}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
          </div>
        </div>
      </section>


      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold">Loved by Professionals Worldwide</h2>
                <p className="text-muted-foreground mt-2">Don't just take our word for it. Here's what our users are saying.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card>
                    <CardContent className="p-6">
                        <p className="mb-4">"DocuEase has been a game-changer for my workflow. The batch processing features save me hours every week!"</p>
                        <div>
                            <p className="font-semibold">Ankit Adhikary</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="mb-4">"The PDF compression tool is the best I've ever used. It reduces file size significantly without losing quality."</p>
                         <div>
                            <p className="font-semibold">Subajit Pal</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="mb-4">"I rely on the 'Merge PDF' tool daily. It's incredibly fast and intuitive. Highly recommended for any office professional."</p>
                         <div>
                            <p className="font-semibold">Akash Roy</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Simplify Your Documents?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Join thousands of happy users and take control of your PDF workflow today. No credit card required.
          </p>
          <Button asChild size="lg">
            <Link href="/login">
              Sign Up Now <ArrowRight className="ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
