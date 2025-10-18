'use client';

import { useState } from 'react';
import { AddPageNumbersClient } from './AddPageNumbersClient';

export default function AddPageNumbersPage() {
  const [pageCount, setPageCount] = useState(0);

  return (
      <div className="py-12">
          <AddPageNumbersClient onPageCountChange={setPageCount} />
      </div>
  );
}
