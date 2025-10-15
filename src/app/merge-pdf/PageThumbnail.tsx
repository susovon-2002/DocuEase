'use client';

import { Badge } from "@/components/ui/badge";

interface PageThumbnailProps {
  thumbnailUrl: string;
  pageNumber: number;
  fileName?: string;
}

export function PageThumbnail({ thumbnailUrl, pageNumber, fileName }: PageThumbnailProps) {
  return (
    <div className="relative rounded-md shadow-md cursor-grab bg-white p-1 border h-full flex flex-col">
      <div className="flex-grow flex items-center justify-center">
        <img
          src={thumbnailUrl}
          alt={`Page ${pageNumber}`}
          className="w-full h-full object-contain rounded-sm"
        />
      </div>
      <Badge variant="secondary" className="absolute bottom-2 left-2">{pageNumber}</Badge>
      {fileName && (
        <Badge variant="outline" className="absolute top-2 left-2 max-w-[calc(100%-1rem)] truncate" title={fileName}>
          {fileName}
        </Badge>
      )}
    </div>
  );
}
