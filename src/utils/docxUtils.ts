/**
 * DOCX to PDF conversion and document parsing utilities for Vexora
 * Uses mammoth for browser-side OpenXML DOCX parsing and pdf-lib for multi-page PDF rendering
 */

import mammoth from 'mammoth';
import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';

export interface DocxParseResult {
  html: string;
  rawText: string;
  paragraphsCount: number;
  wordCount: number;
  warnings: string[];
}

/**
 * Validates whether file is an OpenXML DOCX
 */
export function validateDocxFile(file: File, buffer: ArrayBuffer): { valid: boolean; error?: string } {
  const bytes = new Uint8Array(buffer.slice(0, 4));
  // ZIP magic bytes PK\x03\x04
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (!isZip) {
    if (file.name.toLowerCase().endsWith('.doc')) {
      return {
        valid: false,
        error:
          'This is a legacy binary Word (.doc) file. Please save it as modern Word (.docx) first to convert in the browser.',
      };
    }
    return {
      valid: false,
      error: 'Invalid file format. Please upload a valid Microsoft Word (.docx) document.',
    };
  }
  return { valid: true };
}

/**
 * Parses DOCX file into HTML and text using mammoth
 */
export async function parseDocxFile(buffer: ArrayBuffer): Promise<DocxParseResult> {
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer: buffer.slice(0) });
  const textResult = await mammoth.extractRawText({ arrayBuffer: buffer.slice(0) });

  const rawText = textResult.value || '';
  const words = rawText.trim().split(/\s+/).filter(Boolean).length;
  const paragraphsCount = rawText.split('\n').filter((l) => l.trim().length > 0).length;

  return {
    html: htmlResult.value,
    rawText,
    paragraphsCount,
    wordCount: words,
    warnings: htmlResult.messages.map((m) => m.message),
  };
}

export interface DocxToPdfOptions {
  fontSize: number; // default 11
  fontFamily: 'Helvetica' | 'Times' | 'Courier';
  pageSize: 'a4' | 'letter';
  margin: number; // default 40
  lineHeight: number; // default 1.4
  includePageNumbers: boolean;
  documentTitle?: string;
}

/**
 * Converts DOCX text/structure into a multi-page PDF using pdf-lib
 */
export async function convertDocxToPdf(
  buffer: ArrayBuffer,
  options: DocxToPdfOptions = {
    fontSize: 11,
    fontFamily: 'Helvetica',
    pageSize: 'a4',
    margin: 40,
    lineHeight: 1.4,
    includePageNumbers: true,
  }
): Promise<{ blob: Blob; pageCount: number }> {
  const parsed = await parseDocxFile(buffer);
  const pdfDoc = await PDFDocument.create();

  // Select fonts
  let regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  let boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  if (options.fontFamily === 'Times') {
    regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  } else if (options.fontFamily === 'Courier') {
    regularFont = await pdfDoc.embedFont(StandardFonts.Courier);
    boldFont = await pdfDoc.embedFont(StandardFonts.CourierBold);
  }

  const standardSize = options.pageSize === 'letter' ? PageSizes.Letter : PageSizes.A4;
  const [pageWidth, pageHeight] = standardSize;
  const margin = options.margin;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  // Split raw text into blocks (paragraphs or headings)
  const rawLines = parsed.rawText.split('\n');
  const blocks: { text: string; isHeading: boolean; isBullet: boolean }[] = [];

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      blocks.push({ text: '', isHeading: false, isBullet: false });
      continue;
    }

    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
    const isHeading =
      trimmed.length < 70 &&
      !trimmed.endsWith('.') &&
      (trimmed.toUpperCase() === trimmed || /^[A-Z0-9\s:,-]+$/.test(trimmed));

    blocks.push({
      text: isBullet ? trimmed.replace(/^[•\-\*]\s*/, '') : trimmed,
      isHeading,
      isBullet,
    });
  }

  // Word wrapping function
  const wrapText = (text: string, font: typeof regularFont, size: number, maxW: number): string[] => {
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

  // Compile formatted lines
  interface RenderLine {
    text: string;
    font: typeof regularFont;
    size: number;
    color: { r: number; g: number; b: number };
    isBullet: boolean;
    spacingBefore: number;
  }

  const renderLines: RenderLine[] = [];

  // Optional Title Header
  if (options.documentTitle) {
    renderLines.push({
      text: options.documentTitle,
      font: boldFont,
      size: options.fontSize + 8,
      color: { r: 0.12, g: 0.11, b: 0.29 }, // #1E1B4B
      isBullet: false,
      spacingBefore: 0,
    });
  }

  for (const block of blocks) {
    if (!block.text) {
      // Empty line / paragraph break
      renderLines.push({
        text: '',
        font: regularFont,
        size: options.fontSize,
        color: { r: 0.1, g: 0.1, b: 0.1 },
        isBullet: false,
        spacingBefore: options.fontSize * 0.6,
      });
      continue;
    }

    const font = block.isHeading ? boldFont : regularFont;
    const size = block.isHeading ? options.fontSize + 3 : options.fontSize;
    const color = block.isHeading
      ? { r: 0.15, g: 0.15, b: 0.25 }
      : { r: 0.2, g: 0.2, b: 0.25 };
    const maxW = block.isBullet ? contentWidth - 16 : contentWidth;

    const wrapped = wrapText(block.text, font, size, maxW);
    wrapped.forEach((wLine, idx) => {
      renderLines.push({
        text: wLine,
        font,
        size,
        color,
        isBullet: block.isBullet && idx === 0,
        spacingBefore: idx === 0 && block.isHeading ? options.fontSize * 0.8 : 0,
      });
    });
  }

  // Layout lines into pages
  const pages: RenderLine[][] = [];
  let currentPageLines: RenderLine[] = [];
  let currentY = contentHeight;

  for (const line of renderLines) {
    const lineHeight = line.size * options.lineHeight + line.spacingBefore;

    if (currentY - lineHeight < 0 && currentPageLines.length > 0) {
      pages.push(currentPageLines);
      currentPageLines = [];
      currentY = contentHeight;
    }

    currentPageLines.push(line);
    currentY -= lineHeight;
  }

  if (currentPageLines.length > 0 || pages.length === 0) {
    pages.push(currentPageLines);
  }

  const totalPages = pages.length;

  // Draw pages in pdf-lib
  pages.forEach((pageLines, pageIdx) => {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    for (const line of pageLines) {
      y -= line.spacingBefore;
      const font = line.font;
      const size = line.size;

      if (line.text) {
        if (line.isBullet) {
          // Draw bullet point
          page.drawText('•', {
            x: margin,
            y: y - size,
            size,
            font: regularFont,
            color: rgb(line.color.r, line.color.g, line.color.b),
          });
          // Draw text indented
          page.drawText(line.text, {
            x: margin + 14,
            y: y - size,
            size,
            font,
            color: rgb(line.color.r, line.color.g, line.color.b),
          });
        } else {
          page.drawText(line.text, {
            x: margin,
            y: y - size,
            size,
            font,
            color: rgb(line.color.r, line.color.g, line.color.b),
          });
        }
      }

      y -= size * options.lineHeight;
    }

    // Page Numbering Footer
    if (options.includePageNumbers) {
      const pageNumText = `Page ${pageIdx + 1} of ${totalPages}`;
      const numWidth = regularFont.widthOfTextAtSize(pageNumText, 9);
      page.drawText(pageNumText, {
        x: pageWidth / 2 - numWidth / 2,
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
