
'use client';

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface PageThumbnailProps {
  thumbnailUrl: string;
  pageNumber: number;
  fileName?: string;
  onPageNumberChange: (newPageNumber: string) => void;
}

export function PageThumbnail({ thumbnailUrl, pageNumber, fileName, onPageNumberChange }: PageThumbnailProps) {
  return (
    <div className="relative rounded-md shadow-md cursor-grab bg-white p-1 border h-full flex flex-col">
      <div className="flex-grow flex items-center justify-center">
        <img
          src={thumbnailUrl}
          alt={`Page ${pageNumber}`}
          className="w-full h-full object-contain rounded-sm"
        />
      </div>
      <div className="absolute bottom-1 left-1 flex items-center">
          <Input 
            type="text"
            value={pageNumber}
            onChange={(e) => onPageNumberChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            onClick={(e) => e.stopPropagation()} // Prevent drag from starting on click
            className="h-6 w-10 text-center p-1 z-10"
          />
      </div>
      {fileName && (
        <Badge variant="outline" className="absolute top-2 left-2 max-w-[calc(100%-1rem)] truncate" title={fileName}>
          {fileName}
        </Badge>
      )}
    </div>
  );
}
