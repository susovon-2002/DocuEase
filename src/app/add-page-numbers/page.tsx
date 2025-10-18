'use client';

import { useState } from 'react';
import { AddPageNumbersClient } from './AddPageNumbersClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function AddPageNumbersPage() {
  const [pageCount, setPageCount] = useState(0);

  return (
      <div className="py-12">
        <ToolAuthWrapper pageCount={pageCount}>
          <AddPageNumbersClient onPageCountChange={setPageCount} />
        </ToolAuthWrapper>
      </div>
  );
}
