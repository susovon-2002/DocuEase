import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fontUrl = searchParams.get('url');

  if (!fontUrl) {
    return NextResponse.json({ error: 'Font URL is required' }, { status: 400 });
  }

  try {
    const response = await fetch(fontUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${response.statusText}`);
    }
    const fontBuffer = await response.arrayBuffer();

    return new NextResponse(fontBuffer, {
      headers: {
        'Content-Type': 'font/ttf',
      },
    });
  } catch (error) {
    console.error('Error fetching font:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch font from origin', details: errorMessage }, { status: 500 });
  }
}
