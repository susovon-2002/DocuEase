'use client';

import { useState } from 'react';
import { AddWatermarkClient } from './AddWatermarkClient';

export default function AddWatermarkPage() {
  const [pageCount, setPageCount] = useState(0);
  return (
      <div className="py-12">
          <AddWatermarkClient onPageCountChange={setPageCount} />
      </div>
  );
}
