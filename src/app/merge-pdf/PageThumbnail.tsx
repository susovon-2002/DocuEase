"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface PageThumbnailProps {
  thumbnailUrl: string;
  pageNumber: number;
  fileName?: string;
}

export function PageThumbnail({ thumbnailUrl, pageNumber, fileName }: PageThumbnailProps) {
  
  return (
    <div className="aspect-[2/3] w-full bg-white rounded-md overflow-hidden ring-1 ring-gray-200 relative flex flex-col">
      {thumbnailUrl ? (
         <img src={thumbnailUrl} alt={`Page ${pageNumber}`} className="w-full h-full object-contain flex-grow"/>
      ) : (
        <Skeleton className="w-full h-full flex-grow" />
      )}
      <div className="p-1 bg-background/80 backdrop-blur-sm">
        {fileName ? (
            <p className="text-xs text-center truncate font-medium text-foreground">{fileName}</p>
        ) : (
            <Badge className="absolute bottom-1 right-1" variant="secondary">{pageNumber}</Badge>
        )}
      </div>
    </div>
  );
}
