/**
 * PDF rendering utilities for Vexora using PDF.js (pdfjs-dist)
 * Handles PDF document loading, canvas rendering, thumbnail generation, and image extraction
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure the worker correctly for this Vite build and package version
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl || `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export interface RenderedPageItem {
  pageNumber: number;
  width: number;
  height: number;
  thumbnailUrl: string;
}

/**
 * Load a PDF document from an ArrayBuffer or Uint8Array
 */
export async function loadPdfDocument(data: ArrayBuffer | Uint8Array): Promise<pdfjsLib.PDFDocumentProxy> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(data),
    cMapUrl: 'https://unpkg.com/pdfjs-dist@' + pdfjsLib.version + '/cmaps/',
    cMapPacked: true,
  });
  return await loadingTask.promise;
}

/**
 * Render a single page to an HTML5 Canvas element
 */
export async function renderPdfPageToCanvas(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number = 1.5
): Promise<HTMLCanvasElement> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    throw new Error('Could not get 2D canvas context for PDF rendering');
  }

  // Draw white background by default
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  // Cast to any to satisfy varying typing in pdfjs-dist versions
  await (page.render(renderContext as any).promise);

  return canvas;
}

/**
 * Render a thumbnail data URL for a specific page
 */
export async function renderPageThumbnail(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  targetWidth: number = 240
): Promise<{ dataUrl: string; width: number; height: number }> {
  const page = await pdfDoc.getPage(pageNumber);
  const unscaledViewport = page.getViewport({ scale: 1 });
  const scale = targetWidth / unscaledViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    throw new Error('Canvas context unavailable');
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await (page.render(renderContext as any).promise);

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.85),
    width: Math.round(unscaledViewport.width),
    height: Math.round(unscaledViewport.height),
  };
}

/**
 * Render all pages of a PDF to image Blobs (JPG or PNG)
 */
export async function exportPdfPagesToImages(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  format: 'image/jpeg' | 'image/png',
  quality: number = 0.92,
  dpiScale: number = 2.0,
  onProgress?: (current: number, total: number) => void
): Promise<{ pageNumber: number; blob: Blob; width: number; height: number }[]> {
  const totalPages = pdfDoc.numPages;
  const results: { pageNumber: number; blob: Blob; width: number; height: number }[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const canvas = await renderPdfPageToCanvas(pdfDoc, i, dpiScale);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error(`Failed to convert page ${i} to image`));
        },
        format,
        format === 'image/jpeg' ? quality : undefined
      );
    });

    results.push({
      pageNumber: i,
      blob,
      width: canvas.width,
      height: canvas.height,
    });

    if (onProgress) {
      onProgress(i, totalPages);
    }
  }

  return results;
}
