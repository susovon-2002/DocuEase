
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import type { Tool } from '@/lib/tools';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

type ToolCardProps = {
  tool: Tool;
};

const colorVariants: Record<string, string> = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    indigo: 'text-indigo-400',
    purple: 'text-purple-400',
    pink: 'text-pink-400',
    teal: 'text-teal-400',
    sky: 'text-sky-400',
    orange: 'text-orange-400',
    emerald: 'text-emerald-400',
    cyan: 'text-cyan-400',
    rose: 'text-rose-400',
    lime: 'text-lime-400',
    fuchsia: 'text-fuchsia-400',
    violet: 'text-violet-400',
    amber: 'text-amber-400',
    stone: 'text-stone-400',
    slate: 'text-slate-400',
    gray: 'text-gray-400',
    neutral: 'text-neutral-400',
};


const ToolCard = ({ tool }: ToolCardProps) => {
  const Icon = tool.icon;
  return (
    <Link href={tool.path} className="group block">
      <Card className="h-full transition-all duration-300 ease-in-out bg-secondary/50 hover:border-primary/50 hover:bg-secondary group-hover:-translate-y-1">
        <CardContent className="p-5 flex items-center gap-4">
          <div className={cn('p-3 rounded-lg bg-card', colorVariants[tool.color] || colorVariants.neutral)}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">{tool.title}</CardTitle>
            <CardDescription className="text-xs mt-1 line-clamp-2">{tool.description}</CardDescription>
          </div>
          <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
        </CardContent>
      </Card>
    </Link>
  );
};

export default ToolCard;
