/**
 * File metadata extraction and deep inspection utilities for Vexora
 * Calculates SHA-256 hash, verifies magic bytes, and parses format-specific headers
 */

import { loadPdfDocument } from './pdfRenderUtils';
import { analyzePptxFile } from './pptxUtils';
import { parseDocxFile } from './docxUtils';
import { formatBytes } from './fileUtils';

export interface FileMetadataResult {
  fileName: string;
  fileSize: number;
  fileSizeBytes: string;
  fileExtension: string;
  detectedMimeType: string;
  reportedMimeType: string;
  magicHeader: string;
  sha256: string;
  lastModifiedDate: string;
  fileCategory: 'pdf' | 'image' | 'powerpoint' | 'document' | 'text' | 'archive' | 'other';
  details: Record<string, string | number | boolean>;
  warnings: string[];
}

/**
 * Calculates SHA-256 hex string using browser SubtleCrypto
 */
export async function calculateSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Analyzes magic bytes at start of file
 */
export function identifyMagicBytes(buffer: ArrayBuffer): {
  signature: string;
  description: string;
  detectedMime: string;
} {
  const bytes = new Uint8Array(buffer.slice(0, 16));
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');

  // PDF: %PDF- (25 50 44 46 2D)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    const versionStr = String.fromCharCode(...bytes.slice(0, 8));
    return { signature: hex.slice(0, 23), description: `Adobe PDF (${versionStr})`, detectedMime: 'application/pdf' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a
  ) {
    return { signature: hex.slice(0, 23), description: 'PNG Portable Network Graphics', detectedMime: 'image/png' };
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { signature: hex.slice(0, 8), description: 'JPEG / JFIF / EXIF Image', detectedMime: 'image/jpeg' };
  }

  // WebP: RIFF ... WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { signature: hex.slice(0, 35), description: 'Google WebP Image', detectedMime: 'image/webp' };
  }

  // GIF: GIF87a or GIF89a
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return { signature: hex.slice(0, 17), description: 'GIF Image', detectedMime: 'image/gif' };
  }

  // ZIP / OpenXML: 50 4B 03 04 or 50 4B 05 06
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05)) {
    return { signature: hex.slice(0, 11), description: 'ZIP Archive / OpenXML Package', detectedMime: 'application/zip' };
  }

  // OLE2 Compound Document: D0 CF 11 E0 A1 B1 1A E1 (Legacy Office doc/ppt/xls or encrypted office)
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) {
    return {
      signature: hex.slice(0, 23),
      description: 'Microsoft Compound Document (Legacy Office or Encrypted)',
      detectedMime: 'application/x-ole-storage',
    };
  }

  return { signature: hex.slice(0, 11), description: 'Binary or Plaintext Data', detectedMime: 'application/octet-stream' };
}

/**
 * Inspects a file in depth and returns full metadata
 */
export async function inspectFileMetadata(file: File): Promise<FileMetadataResult> {
  const buffer = await file.arrayBuffer();
  const sha256 = await calculateSha256(buffer);
  const magic = identifyMagicBytes(buffer);
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
  const lastModified = new Date(file.lastModified).toLocaleString();

  const details: Record<string, string | number | boolean> = {
    'File Name': file.name,
    'File Size': `${formatBytes(file.size)} (${file.size.toLocaleString()} bytes)`,
    'Last Modified': lastModified,
    'Reported Type': file.type || 'Unknown / Not specified',
    'Magic Signature': magic.signature,
    'Detected Format': magic.description,
  };

  const warnings: string[] = [];
  let category: FileMetadataResult['fileCategory'] = 'other';

  // 1. PDF Deep Inspection
  if (magic.detectedMime === 'application/pdf' || ext === 'pdf') {
    category = 'pdf';
    try {
      const pdf = await loadPdfDocument(buffer.slice(0));
      details['Page Count'] = pdf.numPages;
      const meta = await pdf.getMetadata();
      if (meta && meta.info) {
        const info = meta.info as Record<string, unknown>;
        if (info.Title) details['Document Title'] = String(info.Title);
        if (info.Author) details['Author'] = String(info.Author);
        if (info.Producer) details['PDF Producer'] = String(info.Producer);
        if (info.Creator) details['Creator Tool'] = String(info.Creator);
        if (info.PDFFormatVersion) details['PDF Specification'] = `v${info.PDFFormatVersion}`;
      }
    } catch (err: unknown) {
      warnings.push('Could not read internal PDF metadata. The document may be password-protected or restricted.');
    }
  }
  // 2. PowerPoint PPTX Inspection
  else if (ext === 'pptx') {
    category = 'powerpoint';
    try {
      const pptxData = await analyzePptxFile(file);
      details['Slide Count'] = pptxData.slideCount;
      details['Embedded Media Files'] = pptxData.media.length;
      if (pptxData.title) details['Presentation Title'] = pptxData.title;
      if (pptxData.author) details['Author'] = pptxData.author;
      if (pptxData.created) details['Creation Date'] = pptxData.created;
    } catch (err: unknown) {
      warnings.push(err instanceof Error ? err.message : 'Could not read PPTX package structure.');
    }
  }
  // 3. Word DOCX Inspection
  else if (ext === 'docx') {
    category = 'document';
    try {
      const docxData = await parseDocxFile(buffer);
      details['Paragraphs'] = docxData.paragraphsCount;
      details['Word Count'] = docxData.wordCount;
      details['Character Count'] = docxData.rawText.length;
    } catch (err: unknown) {
      warnings.push('Could not parse DOCX OpenXML structure.');
    }
  }
  // 4. Image Inspection
  else if (
    magic.detectedMime.startsWith('image/') ||
    file.type.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(ext)
  ) {
    category = 'image';
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = objectUrl;
      });
      URL.revokeObjectURL(objectUrl);

      details['Dimensions'] = `${img.naturalWidth} × ${img.naturalHeight} px`;
      details['Aspect Ratio'] = (img.naturalWidth / img.naturalHeight).toFixed(2) + ':1';
      details['Orientation'] =
        img.naturalWidth > img.naturalHeight
          ? 'Landscape'
          : img.naturalWidth < img.naturalHeight
          ? 'Portrait'
          : 'Square';
      const megapixels = (img.naturalWidth * img.naturalHeight) / 1000000;
      details['Megapixels'] = `${megapixels.toFixed(2)} MP`;
    } catch {
      warnings.push('Could not decode image pixel dimensions.');
    }
  }
  // 5. Plain Text
  else if (['txt', 'md', 'csv', 'json', 'log', 'xml', 'js', 'ts', 'html', 'css'].includes(ext)) {
    category = 'text';
    try {
      const text = await file.text();
      const lines = text.split('\n').length;
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      details['Line Count'] = lines;
      details['Word Count'] = words;
      details['Character Count'] = text.length;
    } catch {
      warnings.push('Could not read text stream.');
    }
  }

  // Extension vs MIME mismatch check
  if (
    magic.detectedMime !== 'application/octet-stream' &&
    magic.detectedMime !== 'application/zip' &&
    file.type &&
    !file.type.includes(magic.detectedMime) &&
    !magic.detectedMime.includes(file.type)
  ) {
    warnings.push(
      `File extension/type (${file.type}) differs from magic byte signature (${magic.description}). Verify this file has not been renamed.`
    );
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    fileSizeBytes: formatBytes(file.size),
    fileExtension: ext.toUpperCase(),
    detectedMimeType: magic.detectedMime,
    reportedMimeType: file.type || 'application/octet-stream',
    magicHeader: magic.signature,
    sha256,
    lastModifiedDate: lastModified,
    fileCategory: category,
    details,
    warnings,
  };
}
