import { PDFDocument } from "pdf-lib";

async function getPdfJs() {
  if (typeof window !== 'undefined') {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
    return pdfjs;
  }
  return null;
}

export async function renderPdfPagesToImageUrls(pdfBytes: Uint8Array): Promise<string[]> {
    const pdfjs = await getPdfJs();
    if (!pdfjs) {
        // Return empty array or throw error if on server
        return [];
    }

    const imageUrls: string[] = [];
    const loadingTask = pdfjs.getDocument({ data: pdfBytes });
    const pdf = await loadingTask.promise;

    for (let i = 1; i <= pdf.numPages; i++) {
        try {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) {
                throw new Error('Could not get canvas context');
            }

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };

            await page.render(renderContext).promise;
            
            const dataUrl = canvas.toDataURL('image/jpeg');
            imageUrls.push(dataUrl);

        } catch (error) {
            console.error(`Error rendering page ${i}:`, error);
            imageUrls.push('');
        }
    }
    
    return imageUrls;
}
