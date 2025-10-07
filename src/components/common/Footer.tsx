'use client';

import React from 'react';
import { Button } from '../ui/button';
import { useVideoPlayer } from '@/hooks/use-video-player';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { togglePlayer } = useVideoPlayer();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center">
        <p className="text-center text-sm text-muted-foreground">
          &copy; {currentYear} DocuEase. All Rights Reserved.
        </p>
        <Button variant="link" onClick={togglePlayer}>
          Entertainment
        </Button>
      </div>
    </footer>
  );
};

export default Footer;
