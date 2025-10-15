import { PDFDocument } from "pdf-lib";
import * as pdfjs from 'pdfjs-dist';

// Set up the worker source for pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export async function renderPdfPagesToImageUrls(pdfBytes: Uint8Array): Promise<string[]> {
    const imageUrls: string[] = [];
    const loadingTask = pdfjs.getDocument(pdfBytes);
    const pdfDoc = await loadingTask.promise;

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        
        // Use a higher resolution viewport for "HD" quality
        const viewport = page.getViewport({ scale: 3.0 }); 

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };

        await page.render(renderContext).promise;
        // Use PNG for lossless quality, which is better for text clarity
        const dataUrl = canvas.toDataURL('image/png'); 
        imageUrls.push(dataUrl);

        // Clean up page resources
        page.cleanup();
    }
    
    return imageUrls;
}
