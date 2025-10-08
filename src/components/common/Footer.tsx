'use client';

import React from 'react';
import { Button } from '../ui/button';
import { useVideoPlayer } from '@/hooks/use-video-player';
import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { togglePlayer } = useVideoPlayer();

  return (
    <footer className="border-t bg-secondary/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-4">DocuEase</h3>
            <p className="text-sm text-muted-foreground">The All-in-One PDF Toolkit</p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Tools</h3>
            <ul className="space-y-2">
              <li><Link href="/merge-pdf" className="text-sm text-muted-foreground hover:text-primary">Merge PDF</Link></li>
              <li><Link href="/compress-pdf" className="text-sm text-muted-foreground hover:text-primary">Compress PDF</Link></li>
              <li><Link href="/split-pdf" className="text-sm text-muted-foreground hover:text-primary">Split PDF</Link></li>
              <li><Link href="/edit-pdf" className="text-sm text-muted-foreground hover:text-primary">Edit PDF</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
               <li><Link href="/pricing" className="text-sm text-muted-foreground hover:text-primary">Pricing</Link></li>
               <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {currentYear} DocuEase. All Rights Reserved.
          </p>
          <Button variant="link" onClick={togglePlayer}>
            Entertainment
          </Button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
