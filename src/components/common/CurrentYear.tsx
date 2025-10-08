'use client';

import { useState, useEffect } from 'react';

export function CurrentYear() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  if (year === null) {
    // Render a placeholder on the server and initial client render
    // You could also return the last known good year as a fallback
    return new Date().getFullYear();
  }

  return <>{year}</>;
}
