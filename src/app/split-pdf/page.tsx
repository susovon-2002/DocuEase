'use client';

import { useState } from 'react';
import { SplitPdfClient } from './SplitPdfClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function SplitPdfPage() {
  const [pageCount, setPageCount] = useState(0);

  return (
      <div className="py-12">
        <ToolAuthWrapper pageCount={pageCount}>
          <SplitPdfClient onPageCountChange={setPageCount} />
        </ToolAuthWrapper>
      </div>
  );
}
