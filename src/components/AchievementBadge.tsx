"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type LucideIcon } from "lucide-react";

interface AchievementBadgeProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function AchievementBadge({ icon: Icon, title, description }: AchievementBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center text-center gap-2">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                <Icon className="w-8 h-8 text-amber-500" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
    