import * as pdfjsLib from "pdfjs-dist";

// Set up the worker for pdfjs just once
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function renderPdfPagesToImageUrls(pdfBytes: Uint8Array): Promise<string[]> {
    const imageUrls: string[] = [];
    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
    const pdf = await loadingTask.promise;

    for (let i = 1; i <= pdf.numPages; i++) {
        try {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 3.0 });
            
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
            // Push a placeholder or handle the error as needed
            // For now, we'll push an empty string, but you could have a placeholder error image URL
            imageUrls.push('');
        }
    }
    
    return imageUrls;
}
