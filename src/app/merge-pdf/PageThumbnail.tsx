"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface PageThumbnailProps {
  thumbnailUrl: string;
  pageNumber: number;
}

export function PageThumbnail({ thumbnailUrl, pageNumber }: PageThumbnailProps) {
  
  return (
    <div className="aspect-[2/3] w-full bg-white rounded-md overflow-hidden ring-1 ring-gray-200 relative">
      {thumbnailUrl ? (
         <img src={thumbnailUrl} alt={`Page ${pageNumber}`} className="w-full h-full object-contain"/>
      ) : (
        <Skeleton className="w-full h-full" />
      )}
      <Badge className="absolute bottom-1 right-1" variant="secondary">{pageNumber}</Badge>
    </div>
  );
}
