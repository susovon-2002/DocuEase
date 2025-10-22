
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { FirebaseClientProvider } from '@/firebase';
import { FloatingVideoPlayer } from '@/components/FloatingVideoPlayer';
import { EntertainmentButton } from '@/components/EntertainmentButton';
import { Analytics } from '@vercel/analytics/react';

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
    <html lang="en" className="h-full dark" suppressHydrationWarning>
      <head>
         <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen bg-background" suppressHydrationWarning>
        <FirebaseClientProvider>
          <Header />
          <main className="flex-grow">{children}</main>
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
