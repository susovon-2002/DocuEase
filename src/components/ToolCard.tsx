import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Tool } from '@/lib/tools';

type ToolCardProps = {
  tool: Tool;
};

const ToolCard = ({ tool }: ToolCardProps) => {
  const Icon = tool.icon;
  return (
    <Link href={tool.path} className="group block">
      <Card className="h-full transition-all duration-300 ease-in-out group-hover:border-primary group-hover:shadow-lg group-hover:-translate-y-1">
        <CardHeader className="flex flex-row items-center gap-4 p-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{tool.title}</CardTitle>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
};

export default ToolCard;
