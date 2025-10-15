import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

async function createPdfFromHtml(html: string, baseUrl: string): Promise<Uint8Array> {
  // Very basic HTML to text conversion
  const textContent = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style blocks
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script blocks
    .replace(/<br\s*\/?>/gi, '\n') // Convert <br> to newlines
    .replace(/<\/p>/gi, '\n') // Convert </p> to newlines
    .replace(/<[^>]+>/g, '') // Strip all other tags
    .replace(/&nbsp;/g, ' ') // Handle non-breaking spaces
    .trim();

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const fontSize = 10;
  const margin = 50;
  const maxWidth = width - margin * 2;
  const lineHeight = fontSize * 1.2;

  const textLines = textContent.split('\n');
  let y = height - margin;

  for (const line of textLines) {
    let currentLine = line;
    while (currentLine.length > 0) {
      if (y < margin) {
        page = pdfDoc.addPage();
        y = page.getHeight() - margin;
      }

      let breakIndex = currentLine.length;
      let lineWidth = font.widthOfTextAtSize(currentLine, fontSize);

      if (lineWidth > maxWidth) {
        let charCount = 0;
        while(charCount < currentLine.length) {
            const nextCharWidth = font.widthOfTextAtSize(currentLine.substring(0, charCount + 1), fontSize);
            if (nextCharWidth > maxWidth) {
                break;
            }
            charCount++;
        }
        breakIndex = charCount;
      }
      
      const lineToDraw = currentLine.substring(0, breakIndex);
      page.drawText(lineToDraw, { x: margin, y, font, size: fontSize, color: rgb(0, 0, 0) });
      y -= lineHeight;
      currentLine = currentLine.substring(breakIndex).trim();
    }
  }

  return pdfDoc.save();
}


export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch the URL. Status: ${response.status}`);
    }

    const htmlContent = await response.text();

    const pdfBytes = await createPdfFromHtml(htmlContent, url);

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="converted.pdf"',
      },
    });
  } catch (error) {
    console.error('HTML to PDF conversion error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: `Server error: ${errorMessage}` }, { status: 500 });
  }
}
