'use client';

import { useState } from 'react';
import { RemovePagesClient } from './RemovePagesClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function RemovePagesPage() {
  const [pageCount, setPageCount] = useState(0);
  return (
      <div className="py-12">
        <ToolAuthWrapper pageCount={pageCount}>
          <RemovePagesClient onPageCountChange={setPageCount} />
        </ToolAuthWrapper>
      </div>
  );
}
