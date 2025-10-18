import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { FirebaseClientProvider } from '@/firebase';
import { FloatingVideoPlayer } from '@/components/FloatingVideoPlayer';
import { EntertainmentButton } from '@/components/EntertainmentButton';
import { Analytics } from '@vercel/analytics/react';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

export const metadata: Metadata = {
  title: 'DocuEase',
  description: 'Convert, compress, merge PDFs or Word files online.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen" suppressHydrationWarning>
        <FirebaseClientProvider>
          <Header />
          <main className="flex-grow bg-background">{children}</main>
          <Footer />
          <FloatingVideoPlayer />
          <EntertainmentButton />
          <Toaster />
        </FirebaseClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
