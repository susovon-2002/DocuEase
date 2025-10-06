"use client";

import { useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Badge } from "@/components/ui/badge";

// Set up the worker for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PageThumbnailProps {
  pdfBytes: Uint8Array;
  pageNumber: number;
}

export function PageThumbnail({ pdfBytes, pageNumber }: PageThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const renderPage = async () => {
      if (!canvasRef.current) return;

      try {
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1); // It's always page 1 of the single-page PDF

        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

      } catch (error) {
        console.error("Error rendering page thumbnail:", error);
        // Optionally draw an error state on the canvas
        const context = canvasRef.current?.getContext("2d");
        if(context) {
            context.fillStyle = "red";
            context.fillRect(0,0, context.canvas.width, context.canvas.height);
        }
      }
    };

    renderPage();
  }, [pdfBytes]);

  return (
    <div className="aspect-[2/3] w-full bg-white rounded-md overflow-hidden ring-1 ring-gray-200 relative">
      <canvas ref={canvasRef} className="w-full h-full"></canvas>
      <Badge className="absolute bottom-1 right-1" variant="secondary">{pageNumber}</Badge>
    </div>
  );
}
