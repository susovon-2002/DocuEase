'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UploadCloud, Link } from 'lucide-react';

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;

function getYouTubeEmbedUrl(url: string): string | null {
  if (!YOUTUBE_REGEX.test(url)) return null;

  let videoId = '';
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0];
  } else if (url.includes('youtube.com/watch?v=')) {
    videoId = new URL(url).searchParams.get('v') || '';
  } else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('/embed/')[1].split('?')[0];
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return null;
}


export default function VideoPlayer() {
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isYoutube, setIsYoutube] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setIsYoutube(false);
    }
  };

  const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUrlInput(event.target.value);
  };

  const handleLoadFromUrl = () => {
    const embedUrl = getYouTubeEmbedUrl(urlInput);
    if (embedUrl) {
      setVideoSrc(embedUrl);
      setIsYoutube(true);
    } else {
      setVideoSrc(urlInput);
      setIsYoutube(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="text"
              placeholder="Enter video URL"
              value={urlInput}
              onChange={handleUrlChange}
              className="flex-grow"
            />
            <Button onClick={handleLoadFromUrl} className="flex-shrink-0">
              <Link className="mr-2 h-4 w-4" /> Load
            </Button>
          </div>
          <div className="text-center text-xs text-muted-foreground">or</div>
          <div>
            <Button onClick={handleUploadClick} variant="outline" className="w-full">
              <UploadCloud className="mr-2 h-4 w-4" /> Upload a Video
            </Button>
            <input
              type="file"
              accept="video/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {videoSrc && (
          <div className="mt-4 rounded-lg overflow-hidden border aspect-video">
            {isYoutube ? (
               <iframe
                key={videoSrc}
                className="w-full h-full"
                src={videoSrc}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <video key={videoSrc} controls autoPlay className="w-full h-full">
                <source src={videoSrc} />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
