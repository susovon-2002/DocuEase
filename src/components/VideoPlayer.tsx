'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UploadCloud, Link as LinkIcon } from 'lucide-react';

export default function VideoPlayer() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<'upload' | 'url' | 'youtube'>('upload');
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoType('upload');
      setFileName(file.name);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Video Player</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Paste a video URL"
              value={url}
              onChange={handleUrlChange}
              className="flex-grow"
            />
            <Button onClick={handleLoadUrl} variant="secondary">
              Load
            </Button>
          </div>
          <div className="text-center text-sm text-muted-foreground">OR</div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              {fileName ? <span className="truncate">{fileName}</span> : 'Upload from your device'}
            </Button>
            <Input
              type="file"
              accept="video/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
        </div>

        {videoSrc && (
          <div className="mt-4 aspect-video">
            {videoType === 'youtube' ? (
              <iframe
                key={videoSrc}
                width="100%"
                height="100%"
                src={videoSrc}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <video key={videoSrc} controls className="w-full h-full rounded-md bg-black" src={videoSrc}>
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
