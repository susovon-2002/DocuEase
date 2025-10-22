
'use client';

import React from 'react';
import Link from 'next/link';
import { CurrentYear } from './CurrentYear';

const DocuEaseLogo = () => (
    <div className="flex items-center space-x-2">
         <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        <span className="font-bold text-xl">DocuEase</span>
    </div>
);


const Footer = () => {

  return (
    <footer className="border-t bg-background/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
             <DocuEaseLogo />
             <p className="text-sm text-muted-foreground mt-4 max-w-xs">All the tools you need to be more productive and work smarter with documents.</p>
          </div>

          <div className="">
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
               <li><Link href="/pricing" className="text-sm text-muted-foreground hover:text-primary">Pricing</Link></li>
               <li><Link href="/print-delivery" className="text-sm text-muted-foreground hover:text-primary">Print &amp; Delivery</Link></li>
               <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">Contact Us</Link></li>
            </ul>
          </div>
           <div className="">
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">Terms of Service</Link></li>
              <li><Link href="/refund-policy" className="text-sm text-muted-foreground hover:text-primary">Refund Policy</Link></li>
              <li><Link href="/shipping-policy" className="text-sm text-muted-foreground hover:text-primary">Shipping Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-center text-sm text-muted-foreground">
            &copy; <CurrentYear /> DocuEase. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
