import { tools } from '@/lib/tools';
import ToolCard from '@/components/ToolCard';
import { groupBy } from 'lodash';

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
    </div>
  );
}
