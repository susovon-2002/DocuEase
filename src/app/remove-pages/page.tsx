'use client';

import { useState } from 'react';
import { RemovePagesClient } from './RemovePagesClient';

export default function RemovePagesPage() {
  const [pageCount, setPageCount] = useState(0);
  return (
      <div className="py-12">
          <RemovePagesClient onPageCountChange={setPageCount} />
      </div>
  );
}
