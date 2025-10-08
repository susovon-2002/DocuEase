
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";

interface PagePreviewDialogProps {
  imageUrl: string | null;
  onOpenChange: (isOpen: boolean) => void;
}

export function PagePreviewDialog({ imageUrl, onOpenChange }: PagePreviewDialogProps) {
  return (
    <Dialog open={!!imageUrl} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-2 sm:p-4">
        <DialogHeader className="flex-row items-center justify-between p-2 rounded-t-lg bg-muted/50">
          <DialogTitle>Page Preview</DialogTitle>
          <DialogClose asChild>
            <button className="p-1 rounded-full hover:bg-muted-foreground/20">
              <X className="w-5 h-5" />
            </button>
          </DialogClose>
        </DialogHeader>
        <ScrollArea className="flex-grow">
          <div className="flex items-start justify-center p-4">
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Page Preview"
                className="max-w-full h-auto object-contain"
              />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
