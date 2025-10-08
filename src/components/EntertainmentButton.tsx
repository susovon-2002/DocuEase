'use client';

import { Clapperboard } from 'lucide-react';
import { Button } from './ui/button';
import { useVideoPlayer } from '@/hooks/use-video-player';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export function EntertainmentButton() {
  const { togglePlayer } = useVideoPlayer();

  return (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                 <Button
                    variant="secondary"
                    size="icon"
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40"
                    onClick={togglePlayer}
                    >
                    <Clapperboard className="h-7 w-7" />
                    <span className="sr-only">Toggle Entertainment Player</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
                <p>Toggle Entertainment</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  );
}
