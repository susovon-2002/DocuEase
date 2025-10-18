'use client';

import { useState } from 'react';
import { SplitPdfClient } from './SplitPdfClient';

export default function SplitPdfPage() {
  const [pageCount, setPageCount] = useState(0);

  return (
      <div className="py-12">
          <SplitPdfClient onPageCountChange={setPageCount} />
      </div>
  );
}
