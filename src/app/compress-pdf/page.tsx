'use client';

import { useState } from 'react';
import { CompressPdfClient } from './CompressPdfClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function CompressPdfPage() {
  const [pageCount, setPageCount] = useState(0);

  return (
      <div className="py-12">
        <ToolAuthWrapper pageCount={pageCount}>
          <CompressPdfClient onPageCountChange={setPageCount} />
        </ToolAuthWrapper>
      </div>
  );
}
