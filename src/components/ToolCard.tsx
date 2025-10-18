import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import type { Tool } from '@/lib/tools';
import { cn } from '@/lib/utils';

type ToolCardProps = {
  tool: Tool;
};

const colorVariants: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400',
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
    pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-400',
    teal: 'bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400',
    sky: 'bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400',
    cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-400',
    rose: 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400',
    lime: 'bg-lime-100 text-lime-600 dark:bg-lime-900/50 dark:text-lime-400',
    fuchsia: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/50 dark:text-fuchsia-400',
    violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
    stone: 'bg-stone-100 text-stone-600 dark:bg-stone-900/50 dark:text-stone-400',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-900/50 dark:text-slate-400',
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-900/50 dark:text-gray-400',
    neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-900/50 dark:text-neutral-400',
};


const ToolCard = ({ tool }: ToolCardProps) => {
  const Icon = tool.icon;
  return (
    <Link href={tool.path} className="group block">
      <Card className="h-full transition-all duration-300 ease-in-out group-hover:border-primary group-hover:shadow-lg group-hover:-translate-y-2">
        <CardContent className="p-6 flex flex-col items-center text-center gap-4">
          <div className={cn('p-4 rounded-full', colorVariants[tool.color] || colorVariants.neutral)}>
            <Icon className="h-10 w-10" />
          </div>
          <CardTitle className="text-lg font-semibold">{tool.title}</CardTitle>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ToolCard;
