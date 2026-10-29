/**
 * Plain Text to PDF, Editor to PDF, and PDF Text Extraction utilities for Vexora
 * Uses pdf-lib for vector PDF creation and PDF.js for text extraction
 */

import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';
import { loadPdfDocument } from './pdfRenderUtils';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface TextToPdfOptions {
  fontSize: number; // 9 - 16 pt
  fontFamily: 'Courier' | 'Helvetica' | 'Times';
  pageSize: 'a4' | 'letter';
  margin: number;
  lineHeight: number;
  includeLineNumbers?: boolean;
  includePageNumbers?: boolean;
  documentTitle?: string;
  author?: string;
}

/**
 * Converts raw string text into a structured multi-page PDF
 */
export async function createPdfFromText(
  textContent: string,
  options: TextToPdfOptions
): Promise<{ blob: Blob; pageCount: number }> {
  if (!textContent.trim()) {
    throw new Error('Please enter or upload text content to generate a PDF.');
  }

  const pdfDoc = await PDFDocument.create();

  // Select fonts
  let regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  let boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  if (options.fontFamily === 'Courier') {
    regularFont = await pdfDoc.embedFont(StandardFonts.Courier);
    boldFont = await pdfDoc.embedFont(StandardFonts.CourierBold);
  } else if (options.fontFamily === 'Times') {
    regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  }

  const standardSize = options.pageSize === 'letter' ? PageSizes.Letter : PageSizes.A4;
  const [pageWidth, pageHeight] = standardSize;
  const margin = options.margin;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  // Split lines and handle soft wrapping
  const inputLines = textContent.replace(/\r\n/g, '\n').split('\n');

  const wrapText = (text: string, font: typeof regularFont, size: number, maxW: number): string[] => {
    if (!text) return [''];
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const w of words) {
      const testLine = currentLine ? `${currentLine} ${w}` : w;
      const textWidth = font.widthOfTextAtSize(testLine, size);

      if (textWidth <= maxW) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = w;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.length > 0 ? lines : [''];
  };

  const processedLines: { text: string; lineNumber?: number }[] = [];
  let lineCounter = 1;

  for (const rawLine of inputLines) {
    const wrapped = wrapText(rawLine, regularFont, options.fontSize, contentWidth - (options.includeLineNumbers ? 28 : 0));
    wrapped.forEach((wLine, idx) => {
      processedLines.push({
        text: wLine,
        lineNumber: idx === 0 && options.includeLineNumbers ? lineCounter : undefined,
      });
    });
    lineCounter++;
  }

  // Calculate lines per page
  const singleLineHeight = options.fontSize * options.lineHeight;
  const headerHeight = options.documentTitle ? singleLineHeight * 3 : 0;
  const usableFirstPageHeight = contentHeight - headerHeight;
  const maxLinesFirstPage = Math.max(1, Math.floor(usableFirstPageHeight / singleLineHeight));
  const maxLinesSubsequentPages = Math.max(1, Math.floor(contentHeight / singleLineHeight));

  // Partition into pages
  const pages: { text: string; lineNumber?: number }[][] = [];
  let currentBatch: { text: string; lineNumber?: number }[] = [];
  let limit = maxLinesFirstPage;

  for (const line of processedLines) {
    if (currentBatch.length >= limit) {
      pages.push(currentBatch);
      currentBatch = [];
      limit = maxLinesSubsequentPages;
    }
    currentBatch.push(line);
  }
  if (currentBatch.length > 0 || pages.length === 0) {
    pages.push(currentBatch);
  }

  const totalPages = pages.length;

  // Draw pages
  pages.forEach((pageLines, pageIdx) => {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    let currentY = pageHeight - margin;

    // First page document header if specified
    if (pageIdx === 0 && options.documentTitle) {
      page.drawText(options.documentTitle, {
        x: margin,
        y: currentY - options.fontSize * 1.5,
        size: options.fontSize + 6,
        font: boldFont,
        color: rgb(0.12, 0.11, 0.29),
      });
      currentY -= options.fontSize * 2.2;

      if (options.author) {
        page.drawText(`By ${options.author}`, {
          x: margin,
          y: currentY - options.fontSize,
          size: options.fontSize - 1,
          font: regularFont,
          color: rgb(0.4, 0.45, 0.5),
        });
        currentY -= options.fontSize * 1.8;
      }
    }

    // Draw text lines
    for (const item of pageLines) {
      let x = margin;
      if (options.includeLineNumbers) {
        if (item.lineNumber !== undefined) {
          const numStr = `${item.lineNumber}`.padStart(3, ' ');
          page.drawText(numStr, {
            x,
            y: currentY - options.fontSize,
            size: options.fontSize - 2,
            font: regularFont,
            color: rgb(0.6, 0.6, 0.65),
          });
        }
        x += 28;
      }

      if (item.text) {
        page.drawText(item.text, {
          x,
          y: currentY - options.fontSize,
          size: options.fontSize,
          font: regularFont,
          color: rgb(0.12, 0.12, 0.15),
        });
      }

      currentY -= singleLineHeight;
    }

    // Page number footer
    if (options.includePageNumbers !== false) {
      const pageText = `Page ${pageIdx + 1} of ${totalPages}`;
      const textWidth = regularFont.widthOfTextAtSize(pageText, 9);
      page.drawText(pageText, {
        x: pageWidth / 2 - textWidth / 2,
        y: margin / 2,
        size: 9,
        font: regularFont,
        color: rgb(0.5, 0.5, 0.55),
      });
    }
  });

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  return {
    blob: new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
    pageCount: totalPages,
  };
}

// ============================================================================
// PDF TEXT EXTRACTION (USING PDF.js)
// ============================================================================

export interface ExtractedPageText {
  pageNumber: number;
  text: string;
  wordCount: number;
  characterCount: number;
  hasSelectableText: boolean;
}

export interface PdfTextExtractionResult {
  fileName: string;
  totalPages: number;
  pages: ExtractedPageText[];
  fullText: string;
  totalWords: number;
  totalCharacters: number;
  isScannedOrEmpty: boolean;
}

/**
 * Extracts selectable text from each page of a PDF using PDF.js
 */
export async function extractTextFromPdf(
  buffer: ArrayBuffer,
  fileName: string,
  onProgress?: (current: number, total: number) => void
): Promise<PdfTextExtractionResult> {
  const pdfDoc: PDFDocumentProxy = await loadPdfDocument(buffer.slice(0));
  const totalPages = pdfDoc.numPages;
  const pages: ExtractedPageText[] = [];
  let fullText = '';

  for (let i = 1; i <= totalPages; i++) {
    if (onProgress) {
      onProgress(i, totalPages);
    }

    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();

    // Group items into lines based on vertical transform coordinates
    interface TextItemWithY {
      str: string;
      y: number;
      x: number;
    }

    const items: TextItemWithY[] = [];
    for (const item of textContent.items) {
      if ('str' in item && typeof item.str === 'string') {
        const tx = item.transform; // [scaleX, skewY, skewX, scaleY, transX, transY]
        items.push({
          str: item.str,
          x: tx[4],
          y: Math.round(tx[5]), // round y to cluster lines cleanly
        });
      }
    }

    // Sort top-to-bottom (higher Y to lower Y in PDF coordinates), then left-to-right
    items.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 3) {
        return b.y - a.y;
      }
      return a.x - b.x;
    });

    // Group into text lines
    const lines: string[] = [];
    let currentY: number | null = null;
    let currentLine: string[] = [];

    for (const item of items) {
      if (currentY === null || Math.abs(item.y - currentY) > 3) {
        if (currentLine.length > 0) {
          lines.push(currentLine.join(' '));
          currentLine = [];
        }
        currentY = item.y;
      }
      if (item.str.trim()) {
        currentLine.push(item.str);
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine.join(' '));
    }

    const pageString = lines.join('\n');
    const wordCount = pageString.trim().split(/\s+/).filter(Boolean).length;
    const charCount = pageString.length;

    pages.push({
      pageNumber: i,
      text: pageString,
      wordCount,
      characterCount: charCount,
      hasSelectableText: charCount > 0,
    });

    fullText += (fullText ? '\n\n--- Page ' + i + ' ---\n\n' : '--- Page 1 ---\n\n') + pageString;
  }

  const totalWords = pages.reduce((acc, p) => acc + p.wordCount, 0);
  const totalCharacters = pages.reduce((acc, p) => acc + p.characterCount, 0);
  const isScannedOrEmpty = totalCharacters < 20;

  return {
    fileName,
    totalPages,
    pages,
    fullText,
    totalWords,
    totalCharacters,
    isScannedOrEmpty,
  };
}
