'use client';

import { Rnd } from 'react-rnd';
import VideoPlayer from '@/components/VideoPlayer';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Grip, X } from 'lucide-react';
import { useVideoPlayer } from '@/hooks/use-video-player';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useState } from 'react';

export function FloatingVideoPlayer() {
  const { isOpen, closePlayer } = useVideoPlayer();
  const isMobile = useIsMobile();
  const [position, setPosition] = useState({ x: 50, y: 100 });
  const [size, setSize] = useState({ width: 560, height: 500 });
  
  useEffect(() => {
    if(isMobile) {
      setSize({ width: window.innerWidth - 40, height: 450 });
      setPosition({ x: 20, y: 80 });
    } else {
      setSize({ width: 560, height: 500 });
      setPosition({ x: window.innerWidth - 600, y: 100 });
    }
  }, [isMobile]);

  if (!isOpen) return null;
  
  return (
    <Rnd
      size={size}
      position={position}
      onDragStop={(e, d) => setPosition({ x: d.x, y: d.y })}
      onResizeStop={(e, direction, ref, delta, position) => {
        setSize({ width: ref.offsetWidth, height: ref.offsetHeight });
        setPosition(position);
      }}
      dragHandleClassName="drag-handle"
      className="z-50"
      bounds="window"
    >
      <Card className="w-full h-full flex flex-col shadow-2xl">
        <CardHeader className="drag-handle cursor-move flex flex-row items-center justify-between p-2 space-y-0 bg-muted/50 rounded-t-lg">
          <div className="flex items-center">
            <Grip className="w-5 h-5 text-muted-foreground mr-2" />
            <h3 className="font-semibold">Entertainment</h3>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={closePlayer}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0 flex-grow">
          <VideoPlayer />
        </CardContent>
      </Card>
    </Rnd>
  );
}