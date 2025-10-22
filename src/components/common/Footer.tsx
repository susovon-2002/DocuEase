
'use client';

import React from 'react';
import Link from 'next/link';
import { CurrentYear } from './CurrentYear';

const DocuEaseLogo = () => (
    <div className="flex items-center space-x-2">
        <span className="font-bold text-3xl font-headline tracking-wider">DocuEase</span>
    </div>
);


const Footer = () => {

  return (
    <footer className="border-t bg-secondary/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="">
             <DocuEaseLogo />
          </div>

          <div className="">
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
               <li><Link href="/pricing" className="text-sm text-muted-foreground hover:text-primary">Pricing</Link></li>
               <li><Link href="/print-delivery" className="text-sm text-muted-foreground hover:text-primary">Print &amp; Delivery</Link></li>
               <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">Contact Us</Link></li>
                 <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">Terms of Service</Link></li>
              <li><Link href="/refund-policy" className="text-sm text-muted-foreground hover:text-primary">Refund Policy</Link></li>
              <li><Link href="/shipping-policy" className="text-sm text-muted-foreground hover:text-primary">Shipping Policy</Link></li>
            </ul>
          </div>
           <div className="">
            <h3 className="font-semibold mb-4">Address</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Sector v, Bidhannagar,<br/>Near Technopolis, kolkata 700091</p>
              <p>susovonsantra4@gmail.com</p>
              <p>ph.no 8910819035</p>
            </div>
          </div>
        </div>
        <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row justify-center items-center">
          <p className="text-center text-sm text-muted-foreground">
            &copy; <CurrentYear /> DocuEase. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
