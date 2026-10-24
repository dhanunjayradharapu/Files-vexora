/**
 * PDF generation and manipulation utilities for Vexora using pdf-lib
 * Purely client-side PDF document composition, merging, splitting, watermarking,
 * rotating, reordering, page numbering, image stamping, and compression.
 */

import {
  PDFDocument,
  PageSizes,
  degrees,
  rgb,
  StandardFonts,
} from 'pdf-lib';
import { loadImageFromFile, canvasToBlob } from './imageUtils';

export type PageSizeOption = 'a4' | 'letter' | 'fit';
export type PageOrientationOption = 'auto' | 'portrait' | 'landscape';
export type PageMarginOption = 'none' | 'small' | 'medium';

export interface ImageToPdfOptions {
  pageSize: PageSizeOption;
  orientation: PageOrientationOption;
  margin: PageMarginOption;
}

export interface PdfImageItem {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  rotation?: number; // 0, 90, 180, 270
}

const MARGIN_MAP: Record<PageMarginOption, number> = {
  none: 0,
  small: 20,
  medium: 40,
};

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Normalizes an image file to JPG or PNG Uint8Array bytes for pdf-lib embedding
 */
async function getImageBytesForPdf(
  file: File,
  rotation: number = 0
): Promise<{ bytes: Uint8Array; format: 'jpg' | 'png'; width: number; height: number }> {
  const { img, objectUrl } = await loadImageFromFile(file);

  try {
    const needsCanvas =
      rotation !== 0 ||
      file.type === 'image/webp' ||
      file.type === 'image/gif' ||
      file.type === 'image/bmp' ||
      file.type === 'image/svg+xml';

    if (needsCanvas) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      const radians = (rotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(radians));
      const cos = Math.abs(Math.cos(radians));

      const w = img.naturalWidth;
      const h = img.naturalHeight;

      const newW = Math.round(w * cos + h * sin);
      const newH = Math.round(w * sin + h * cos);

      canvas.width = Math.max(1, newW);
      canvas.height = Math.max(1, newH);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(radians);
      ctx.drawImage(img, -w / 2, -h / 2);
      ctx.restore();

      const blob = await canvasToBlob(canvas, 'image/png', 1.0);
      const arrayBuffer = await blob.arrayBuffer();
      return {
        bytes: new Uint8Array(arrayBuffer),
        format: 'png',
        width: canvas.width,
        height: canvas.height,
      };
    }

    const isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg';
    const arrayBuffer = await file.arrayBuffer();

    return {
      bytes: new Uint8Array(arrayBuffer),
      format: isJpeg ? 'jpg' : 'png',
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Generates a PDF Blob from an array of images with custom layout options
 */
export async function createPdfFromImages(
  items: PdfImageItem[],
  options: ImageToPdfOptions,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  if (items.length === 0) {
    throw new Error('Please select at least one image to convert to PDF');
  }

  const pdfDoc = await PDFDocument.create();
  const margin = MARGIN_MAP[options.margin];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (onProgress) {
      onProgress(i + 1, items.length);
    }

    const { bytes, format, width: imgWidth, height: imgHeight } = await getImageBytesForPdf(
      item.file,
      item.rotation || 0
    );

    const embeddedImage = format === 'jpg' ? await pdfDoc.embedJpg(bytes) : await pdfDoc.embedPng(bytes);

    let pageWidth: number;
    let pageHeight: number;

    if (options.pageSize === 'fit') {
      pageWidth = imgWidth + margin * 2;
      pageHeight = imgHeight + margin * 2;
    } else {
      const standardSize = options.pageSize === 'letter' ? PageSizes.Letter : PageSizes.A4;
      let [baseWidth, baseHeight] = standardSize;

      let isLandscape = false;
      if (options.orientation === 'landscape') {
        isLandscape = true;
      } else if (options.orientation === 'portrait') {
        isLandscape = false;
      } else {
        isLandscape = imgWidth > imgHeight;
      }

      pageWidth = isLandscape ? Math.max(baseWidth, baseHeight) : Math.min(baseWidth, baseHeight);
      pageHeight = isLandscape ? Math.min(baseWidth, baseHeight) : Math.max(baseWidth, baseHeight);
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    const availWidth = Math.max(10, pageWidth - margin * 2);
    const availHeight = Math.max(10, pageHeight - margin * 2);

    const scaleFactor = Math.min(availWidth / imgWidth, availHeight / imgHeight);
    const drawWidth = imgWidth * scaleFactor;
    const drawHeight = imgHeight * scaleFactor;

    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

// ============================================================================
// MERGE PDF
// ============================================================================

export interface MergePdfFileItem {
  id: string;
  file: File;
  pageCount?: number;
}

/**
 * Merges multiple PDF ArrayBuffers into a single unified document
 */
export async function mergePdfDocuments(
  pdfFiles: ArrayBuffer[],
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  if (pdfFiles.length < 2) {
    throw new Error('Please select at least 2 PDF documents to merge');
  }

  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < pdfFiles.length; i++) {
    const srcDoc = await PDFDocument.load(pdfFiles[i], { ignoreEncryption: true });
    const pageIndices = srcDoc.getPageIndices();
    const copiedPages = await mergedPdf.copyPages(srcDoc, pageIndices);

    copiedPages.forEach((page) => {
      mergedPdf.addPage(page);
    });

    if (onProgress) {
      onProgress(i + 1, pdfFiles.length);
    }
  }

  const mergedBytes = await mergedPdf.save({ useObjectStreams: true });
  return new Blob([mergedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

// ============================================================================
// SPLIT & EXTRACT PDF
// ============================================================================

/**
 * Parses user range strings like "1-3, 5, 8-10" into 0-based page indices
 */
export function parsePageRangeString(rangeStr: string, maxPages: number): number[] {
  const parts = rangeStr.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
  const pageSet = new Set<number>();

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(maxPages, Math.max(start, end));
        for (let p = from; p <= to; p++) {
          pageSet.add(p - 1);
        }
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= maxPages) {
        pageSet.add(p - 1);
      }
    }
  }

  return Array.from(pageSet).sort((a, b) => a - b);
}

/**
 * Extracts specific 0-based page indices into a new PDF
 */
export async function extractPagesFromPdf(
  pdfBuffer: ArrayBuffer,
  selectedIndices: number[]
): Promise<Blob> {
  if (selectedIndices.length === 0) {
    throw new Error('No pages selected for extraction');
  }

  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  const validIndices = selectedIndices.filter((idx) => idx >= 0 && idx < srcDoc.getPageCount());
  if (validIndices.length === 0) {
    throw new Error('Selected pages are out of document range');
  }

  const copiedPages = await newDoc.copyPages(srcDoc, validIndices);
  copiedPages.forEach((page) => newDoc.addPage(page));

  const bytes = await newDoc.save({ useObjectStreams: true });
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

/**
 * Splits a PDF by page ranges into multiple separate PDF Blobs
 */
export async function splitPdfIntoRanges(
  pdfBuffer: ArrayBuffer,
  ranges: { label: string; indices: number[] }[]
): Promise<{ filename: string; blob: Blob }[]> {
  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const total = srcDoc.getPageCount();
  const outputs: { filename: string; blob: Blob }[] = [];

  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    const valid = range.indices.filter((idx) => idx >= 0 && idx < total);
    if (valid.length === 0) continue;

    const subDoc = await PDFDocument.create();
    const copied = await subDoc.copyPages(srcDoc, valid);
    copied.forEach((p) => subDoc.addPage(p));

    const bytes = await subDoc.save({ useObjectStreams: true });
    outputs.push({
      filename: `split_${range.label}.pdf`,
      blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
    });
  }

  return outputs;
}

// ============================================================================
// ROTATE PDF PAGES
// ============================================================================

/**
 * Rotates selected pages by given angles (e.g. +90, +180, etc.)
 */
export async function rotatePdfDocumentPages(
  pdfBuffer: ArrayBuffer,
  rotations: Record<number, number> // 0-based page index -> additional degrees (90, 180, 270)
): Promise<Blob> {
  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pages = doc.getPages();

  Object.entries(rotations).forEach(([indexStr, deltaDeg]) => {
    const pageIndex = parseInt(indexStr, 10);
    if (pageIndex >= 0 && pageIndex < pages.length) {
      const page = pages[pageIndex];
      const currentRotation = page.getRotation().angle;
      const newRotation = (currentRotation + deltaDeg + 360) % 360;
      page.setRotation(degrees(newRotation));
    }
  });

  const bytes = await doc.save({ useObjectStreams: true });
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

// ============================================================================
// REORDER & ORGANIZE PDF PAGES
// ============================================================================

/**
 * Reorders/duplicates/deletes pages in a PDF document
 * @param newOrder 0-based page indices in new desired order
 */
export async function reorderPdfDocumentPages(
  pdfBuffer: ArrayBuffer,
  newOrder: number[]
): Promise<Blob> {
  if (newOrder.length === 0) {
    throw new Error('At least one page must remain in the document');
  }

  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  const copiedPages = await newDoc.copyPages(srcDoc, newOrder);
  copiedPages.forEach((page) => newDoc.addPage(page));

  const bytes = await newDoc.save({ useObjectStreams: true });
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

// ============================================================================
// ADD PAGE NUMBERS
// ============================================================================

export type PageNumberPosition =
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'top-right'
  | 'top-left';

export interface PageNumberOptions {
  position: PageNumberPosition;
  format: 'page-x-of-y' | 'x-of-y' | 'only-x';
  startPageNumber: number;
  fontSize: number;
  margin: number;
  color: 'black' | 'gray' | 'indigo';
  skipFirstPage?: boolean;
}

export async function addPageNumbersToPdf(
  pdfBuffer: ArrayBuffer,
  options: PageNumberOptions
): Promise<Blob> {
  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const totalPages = pages.length;

  const colorMap = {
    black: rgb(0.1, 0.1, 0.1),
    gray: rgb(0.4, 0.4, 0.45),
    indigo: rgb(0.31, 0.27, 0.9),
  };
  const fontColor = colorMap[options.color] || colorMap.black;

  pages.forEach((page, index) => {
    if (options.skipFirstPage && index === 0) return;

    const currentNumber = index + options.startPageNumber - (options.skipFirstPage ? 1 : 0);
    let text = `${currentNumber}`;
    if (options.format === 'page-x-of-y') {
      text = `Page ${currentNumber} of ${totalPages}`;
    } else if (options.format === 'x-of-y') {
      text = `${currentNumber} / ${totalPages}`;
    }

    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, options.fontSize);
    const textHeight = font.heightAtSize(options.fontSize);

    let x = width / 2 - textWidth / 2;
    let y = options.margin;

    switch (options.position) {
      case 'bottom-center':
        x = width / 2 - textWidth / 2;
        y = options.margin;
        break;
      case 'bottom-right':
        x = width - options.margin - textWidth;
        y = options.margin;
        break;
      case 'bottom-left':
        x = options.margin;
        y = options.margin;
        break;
      case 'top-center':
        x = width / 2 - textWidth / 2;
        y = height - options.margin - textHeight;
        break;
      case 'top-right':
        x = width - options.margin - textWidth;
        y = height - options.margin - textHeight;
        break;
      case 'top-left':
        x = options.margin;
        y = height - options.margin - textHeight;
        break;
    }

    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: fontColor,
    });
  });

  const bytes = await doc.save({ useObjectStreams: true });
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

// ============================================================================
// ADD TEXT WATERMARK
// ============================================================================

export interface WatermarkOptions {
  text: string;
  angle: 'diagonal' | 'horizontal' | 'vertical';
  fontSize: number;
  opacity: number;
  color: 'slate' | 'red' | 'indigo' | 'amber';
  repeatGrid?: boolean;
}

export async function addWatermarkToPdf(
  pdfBuffer: ArrayBuffer,
  options: WatermarkOptions
): Promise<Blob> {
  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();

  const colorMap = {
    slate: rgb(0.4, 0.45, 0.5),
    red: rgb(0.85, 0.15, 0.15),
    indigo: rgb(0.31, 0.27, 0.9),
    amber: rgb(0.85, 0.5, 0.05),
  };
  const fontColor = colorMap[options.color] || colorMap.slate;

  const rotationAngle =
    options.angle === 'diagonal' ? 45 : options.angle === 'vertical' ? 90 : 0;

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);
    const textHeight = font.heightAtSize(options.fontSize);

    if (options.repeatGrid) {
      // Draw grid of repeated watermarks
      const xSpacing = textWidth + 120;
      const ySpacing = textHeight + 140;

      for (let x = -width * 0.2; x < width * 1.2; x += xSpacing) {
        for (let y = -height * 0.2; y < height * 1.2; y += ySpacing) {
          page.drawText(options.text, {
            x,
            y,
            size: options.fontSize,
            font,
            color: fontColor,
            opacity: options.opacity,
            rotate: degrees(rotationAngle),
          });
        }
      }
    } else {
      // Draw single centered watermark
      const rad = (rotationAngle * Math.PI) / 180;
      const cx = width / 2;
      const cy = height / 2;

      // Adjust offset for rotated text centered anchor
      const offsetX = (textWidth / 2) * Math.cos(rad) - (textHeight / 2) * Math.sin(rad);
      const offsetY = (textWidth / 2) * Math.sin(rad) + (textHeight / 2) * Math.cos(rad);

      page.drawText(options.text, {
        x: cx - offsetX,
        y: cy - offsetY,
        size: options.fontSize,
        font,
        color: fontColor,
        opacity: options.opacity,
        rotate: degrees(rotationAngle),
      });
    }
  });

  const bytes = await doc.save({ useObjectStreams: true });
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

// ============================================================================
// ADD IMAGE (SIGNATURE / STAMP / LOGO) TO PDF
// ============================================================================

export interface AddImageOptions {
  position: 'bottom-right' | 'bottom-left' | 'center' | 'top-right' | 'top-left';
  scaleWidth: number; // width in points
  opacity: number;
  margin: number;
  targetPages: 'all' | 'first' | 'last';
}

export async function addImageToPdf(
  pdfBuffer: ArrayBuffer,
  imageFile: File,
  options: AddImageOptions
): Promise<Blob> {
  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const isJpeg = imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg';
  const arrayBuffer = await imageFile.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const embeddedImage = isJpeg ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
  const imgAspectRatio = embeddedImage.width / embeddedImage.height;
  const drawWidth = options.scaleWidth;
  const drawHeight = drawWidth / imgAspectRatio;

  const pages = doc.getPages();
  const targetIndices: number[] = [];

  if (options.targetPages === 'first') targetIndices.push(0);
  else if (options.targetPages === 'last') targetIndices.push(pages.length - 1);
  else {
    for (let i = 0; i < pages.length; i++) targetIndices.push(i);
  }

  targetIndices.forEach((idx) => {
    if (idx < 0 || idx >= pages.length) return;
    const page = pages[idx];
    const { width, height } = page.getSize();

    let x = width - drawWidth - options.margin;
    let y = options.margin;

    switch (options.position) {
      case 'bottom-right':
        x = width - drawWidth - options.margin;
        y = options.margin;
        break;
      case 'bottom-left':
        x = options.margin;
        y = options.margin;
        break;
      case 'center':
        x = (width - drawWidth) / 2;
        y = (height - drawHeight) / 2;
        break;
      case 'top-right':
        x = width - drawWidth - options.margin;
        y = height - drawHeight - options.margin;
        break;
      case 'top-left':
        x = options.margin;
        y = height - drawHeight - options.margin;
        break;
    }

    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
      opacity: options.opacity,
    });
  });

  const outputBytes = await doc.save({ useObjectStreams: true });
  return new Blob([outputBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

// ============================================================================
// COMPRESS PDF (HONEST IN-BROWSER OPTIMIZATION)
// ============================================================================

export interface PdfCompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  savingsPercentage: number;
  reduced: boolean;
  notes: string;
}

/**
 * Optimizes PDF by restructuring objects, enabling object streams, and stripping unneeded metadata
 */
export async function optimizePdfDocument(pdfBuffer: ArrayBuffer): Promise<PdfCompressionResult> {
  const originalSize = pdfBuffer.byteLength;
  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

  // Clear verbose metadata trees to reduce bloat
  doc.setTitle('');
  doc.setAuthor('');
  doc.setSubject('');
  doc.setKeywords([]);
  doc.setProducer('Vexora PDF Optimizer');
  doc.setCreator('Vexora');

  // Re-save with object stream compression
  const savedBytes = await doc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  const compressedSize = savedBytes.byteLength;
  const diff = originalSize - compressedSize;
  const reduced = diff > 0;
  const savingsPct = originalSize > 0 ? Math.max(0, Math.round((diff / originalSize) * 1000) / 10) : 0;

  let notes = '';
  if (reduced) {
    notes = `Optimized object streams and stripped redundant metadata dictionaries, saving ${diff} bytes (${savingsPct}%).`;
  } else {
    notes = `This PDF already uses tight object stream encoding or pre-compressed high-density JPEG bitmaps. In-browser lossless restructuring preserves all original vectors without image degradation.`;
  }

  return {
    blob: new Blob([savedBytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
    originalSize,
    compressedSize,
    savedBytes: Math.max(0, diff),
    savingsPercentage: savingsPct,
    reduced,
    notes,
  };
}
