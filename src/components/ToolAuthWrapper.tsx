'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { UpgradeProModal } from './UpgradeProModal';

interface ToolAuthWrapperProps {
  children: React.ReactNode;
  pageCount: number;
}

const PAGE_LIMIT = 20;

export function ToolAuthWrapper({ children, pageCount }: ToolAuthWrapperProps) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (pageCount > PAGE_LIMIT && !user) {
      return (
        <div className="container mx-auto px-4 py-12">
            <div className="w-full max-w-2xl mx-auto">
                 <UpgradeProModal 
                    title="Login Required"
                    description={`This PDF has ${pageCount} pages. To process documents with more than ${PAGE_LIMIT} pages, please log in or create an account.`}
                />
            </div>
        </div>
      )
  }

  return <>{children}</>;
}
