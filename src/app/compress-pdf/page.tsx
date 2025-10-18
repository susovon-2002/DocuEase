'use client';

import { useState } from 'react';
import { CompressPdfClient } from './CompressPdfClient';

export default function CompressPdfPage() {
  const [pageCount, setPageCount] = useState(0);

  return (
      <div className="py-12">
          <CompressPdfClient onPageCountChange={setPageCount} />
      </div>
  );
}
