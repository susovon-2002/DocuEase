'use client';

import { useState } from 'react';
import { AddWatermarkClient } from './AddWatermarkClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function AddWatermarkPage() {
  const [pageCount, setPageCount] = useState(0);
  return (
      <div className="py-12">
        <ToolAuthWrapper pageCount={pageCount}>
          <AddWatermarkClient onPageCountChange={setPageCount} />
        </ToolAuthWrapper>
      </div>
  );
}
