'use client';

import { Rnd } from 'react-rnd';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Grip, X, UploadCloud } from 'lucide-react';
import { useVideoPlayer } from '@/hooks/use-video-player';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useState, useRef } from 'react';
import { Input } from './ui/input';

export function FloatingVideoPlayer() {
  const { isOpen, closePlayer } = useVideoPlayer();
  const isMobile = useIsMobile();
  
  const [position, setPosition] = useState({ x: 50, y: 100 });
  const [size, setSize] = useState({ width: 560, height: 500 });
  
  // Video Player State
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<'upload' | 'url' | 'youtube'>('upload');
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if(isMobile) {
      setSize({ width: window.innerWidth - 40, height: 450 });
      setPosition({ x: 20, y: 80 });
    } else {
      setSize({ width: 560, height: 500 });
      setPosition({ x: window.innerWidth - 600, y: 100 });
    }
  }, [isMobile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoType('upload');
      setFileName(file.name);
      setUrl('');
    }
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };

  const getYouTubeEmbedUrl = (youtubeUrl: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = youtubeUrl.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return null;
  };
  
  const handleLoadUrl = () => {
    const youtubeUrl = getYouTubeEmbedUrl(url);
    if (youtubeUrl) {
      setVideoSrc(youtubeUrl);
      setVideoType('youtube');
    } else {
      setVideoSrc(url);
      setVideoType('url');
    }
    setFileName('');
  };

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
      minWidth={320}
      minHeight={400}
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
        <CardContent className="p-4 flex-grow flex flex-col gap-4">
           <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Paste a video URL (e.g. YouTube)"
                  value={url}
                  onChange={handleUrlChange}
                  className="flex-grow bg-background"
                />
                <Button onClick={handleLoadUrl} variant="secondary">
                  Load
                </Button>
              </div>
              <div className="text-center text-xs text-muted-foreground">OR</div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  {fileName ? <span className="truncate">{fileName}</span> : 'Upload video from device'}
                </Button>
                <Input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
            </div>
            
             {videoSrc ? (
              <div className="aspect-video flex-grow relative bg-black rounded-md overflow-hidden">
                {videoType === 'youtube' ? (
                  <iframe
                    key={videoSrc}
                    width="100%"
                    height="100%"
                    className="absolute inset-0"
                    src={videoSrc}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <video key={videoSrc} controls autoPlay className="w-full h-full absolute inset-0" src={videoSrc}>
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            ) : (
                <div className="flex-grow flex items-center justify-center bg-muted/50 border-2 border-dashed rounded-md text-muted-foreground">
                    Your video will play here
                </div>
            )}
        </CardContent>
      </Card>
    </Rnd>
  );
}
