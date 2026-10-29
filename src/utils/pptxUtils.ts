/**
 * PowerPoint (.pptx) manipulation and inspection utilities for Vexora
 * Uses JSZip for parsing OpenXML structures and PptxGenJS for creating presentations
 */

import JSZip from 'jszip';
import pptxgen from 'pptxgenjs';

export interface ExtractedPptxMedia {
  name: string;
  extension: string;
  mimeType: string;
  size: number;
  blob: Blob;
  previewUrl: string;
  slideNumber?: number;
}

export interface PptxSlideInfo {
  slideNumber: number;
  title: string;
  texts: string[];
  notes?: string;
  mediaCount: number;
}

export interface PptxAnalysisResult {
  fileName: string;
  fileSize: number;
  slideCount: number;
  slides: PptxSlideInfo[];
  media: ExtractedPptxMedia[];
  title?: string;
  author?: string;
  created?: string;
  modified?: string;
  isEncrypted: boolean;
}

/**
 * Validates whether an ArrayBuffer is a valid modern OpenXML PPTX or detects encrypted/legacy files
 */
export function detectPptxType(buffer: ArrayBuffer, fileName: string): {
  valid: boolean;
  isLegacyPpt: boolean;
  isEncrypted: boolean;
  errorMessage?: string;
} {
  const bytes = new Uint8Array(buffer.slice(0, 8));
  // Standard ZIP magic bytes (PK\x03\x04 or PK\x05\x06)
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  // Legacy OLE2 Compound Document header (\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1)
  const isOleCompound =
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0 &&
    bytes[4] === 0xa1 &&
    bytes[5] === 0xb1 &&
    bytes[6] === 0x1a &&
    bytes[7] === 0xe1;

  if (isOleCompound) {
    if (fileName.toLowerCase().endsWith('.ppt')) {
      return {
        valid: false,
        isLegacyPpt: true,
        isEncrypted: false,
        errorMessage:
          'This is a legacy binary PowerPoint (.ppt) file. Vexora works with modern OpenXML (.pptx) files. Please re-save your file as .pptx in PowerPoint, Google Slides, or LibreOffice.',
      };
    }
    // Password-encrypted PPTX files are packaged inside an OLE2 EncryptedPackage
    return {
      valid: false,
      isLegacyPpt: false,
      isEncrypted: true,
      errorMessage:
        'This PowerPoint presentation is password-encrypted. Vexora runs securely in your browser and cannot decrypt password-protected Office packages without credentials.',
    };
  }

  if (!isZip) {
    return {
      valid: false,
      isLegacyPpt: false,
      isEncrypted: false,
      errorMessage:
        'Invalid PowerPoint file format. The file does not have a valid OpenXML package structure.',
    };
  }

  return { valid: true, isLegacyPpt: false, isEncrypted: false };
}

/**
 * Maps file extension to common image MIME types
 */
function getMediaMimeType(ext: string): string {
  switch (ext.toLowerCase()) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'emf':
      return 'image/emf';
    case 'wmf':
      return 'image/wmf';
    case 'bmp':
      return 'image/bmp';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Inspects a PPTX file using JSZip, extracting embedded media and text from slides
 */
export async function analyzePptxFile(file: File): Promise<PptxAnalysisResult> {
  const buffer = await file.arrayBuffer();
  const detection = detectPptxType(buffer, file.name);
  if (!detection.valid) {
    throw new Error(detection.errorMessage || 'Invalid PowerPoint file');
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch (err: unknown) {
    throw new Error(
      'Could not read presentation ZIP archive. The file may be damaged or password protected.'
    );
  }

  // 1. Extract embedded media files from ppt/media/
  const mediaItems: ExtractedPptxMedia[] = [];
  const mediaFolder = zip.folder('ppt/media');

  if (mediaFolder) {
    const mediaFiles = Object.keys(zip.files).filter((path) =>
      path.startsWith('ppt/media/') && !zip.files[path].dir
    );

    for (const filePath of mediaFiles) {
      const zipEntry = zip.files[filePath];
      const fileName = filePath.replace('ppt/media/', '');
      const ext = fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : 'bin';
      const mimeType = getMediaMimeType(ext);

      const arrayBuffer = await zipEntry.async('arraybuffer');
      const blob = new Blob([arrayBuffer], { type: mimeType });
      const previewUrl = URL.createObjectURL(blob);

      mediaItems.push({
        name: fileName,
        extension: ext,
        mimeType,
        size: arrayBuffer.byteLength,
        blob,
        previewUrl,
      });
    }
  }

  // 2. Parse core properties (docProps/core.xml) for author, title, timestamps
  let title = '';
  let author = '';
  let created = '';
  let modified = '';

  const coreXmlEntry = zip.file('docProps/core.xml');
  if (coreXmlEntry) {
    try {
      const coreXml = await coreXmlEntry.async('text');
      const parser = new DOMParser();
      const doc = parser.parseFromString(coreXml, 'application/xml');

      title = doc.querySelector('title')?.textContent || '';
      author = doc.querySelector('creator')?.textContent || '';
      created = doc.querySelector('created')?.textContent || '';
      modified = doc.querySelector('modified')?.textContent || '';
    } catch {
      // Ignore XML metadata errors
    }
  }

  // 3. Find all slides: ppt/slides/slide{N}.xml
  const slidePaths = Object.keys(zip.files)
    .filter((path) => path.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/)![1], 10);
      const numB = parseInt(b.match(/slide(\d+)\.xml/)![1], 10);
      return numA - numB;
    });

  const slides: PptxSlideInfo[] = [];

  for (let i = 0; i < slidePaths.length; i++) {
    const slidePath = slidePaths[i];
    const slideNum = i + 1;
    const slideEntry = zip.file(slidePath);

    let slideTitle = '';
    const textPieces: string[] = [];

    if (slideEntry) {
      try {
        const slideXml = await slideEntry.async('text');
        const parser = new DOMParser();
        const doc = parser.parseFromString(slideXml, 'application/xml');

        // DrawingML text runs are inside <a:t>
        const textNodes = doc.querySelectorAll('t');
        textNodes.forEach((node) => {
          const val = node.textContent?.trim();
          if (val) {
            textPieces.push(val);
          }
        });

        // Try to identify title (usually first text element or placeholder with type="title")
        if (textPieces.length > 0) {
          slideTitle = textPieces[0];
        }
      } catch {
        // Fallback
      }
    }

    // Check presenter notes: ppt/notesSlides/notesSlide{N}.xml
    let notesText = '';
    const notesEntry = zip.file(`ppt/notesSlides/notesSlide${slideNum}.xml`);
    if (notesEntry) {
      try {
        const notesXml = await notesEntry.async('text');
        const parser = new DOMParser();
        const doc = parser.parseFromString(notesXml, 'application/xml');
        const noteNodes = doc.querySelectorAll('t');
        const noteLines: string[] = [];
        noteNodes.forEach((n) => {
          const t = n.textContent?.trim();
          if (t && !t.includes('Slide') && !t.match(/^\d+$/)) {
            noteLines.push(t);
          }
        });
        notesText = noteLines.join(' ');
      } catch {
        // Ignore note parsing errors
      }
    }

    slides.push({
      slideNumber: slideNum,
      title: slideTitle || `Slide ${slideNum}`,
      texts: textPieces,
      notes: notesText || undefined,
      mediaCount: 0,
    });
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    slideCount: Math.max(slides.length, 1),
    slides,
    media: mediaItems,
    title: title || undefined,
    author: author || undefined,
    created: created ? new Date(created).toLocaleDateString() : undefined,
    modified: modified ? new Date(modified).toLocaleDateString() : undefined,
    isEncrypted: false,
  };
}

// ============================================================================
// CREATE PPTX FROM IMAGES USING PptxGenJS
// ============================================================================

export interface ImageToPptxOptions {
  presentationTitle: string;
  author: string;
  layout: '16x9' | '4x3';
  fitMode: 'fit' | 'cover' | 'contain-caption';
  backgroundColor: string; // hex
  includeTitleSlide: boolean;
}

export interface ImagePptxItem {
  id: string;
  file: File;
  previewUrl: string;
  caption?: string;
}

/**
 * Creates a PPTX presentation from selected images using PptxGenJS
 */
export async function createPptxFromImages(
  items: ImagePptxItem[],
  options: ImageToPptxOptions,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  if (items.length === 0) {
    throw new Error('Please select at least one image to include in the presentation.');
  }

  // Initialize PptxGenJS instance
  const pptx = new pptxgen();
  pptx.layout = options.layout === '16x9' ? 'LAYOUT_16x9' : 'LAYOUT_4x3';
  pptx.title = options.presentationTitle || 'Vexora Presentation';
  pptx.author = options.author || 'Vexora User';

  // 1. Optional Title Slide
  if (options.includeTitleSlide && options.presentationTitle) {
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: options.backgroundColor.replace('#', '') };

    titleSlide.addText(options.presentationTitle, {
      x: '10%',
      y: '35%',
      w: '80%',
      h: 1.5,
      fontSize: 36,
      bold: true,
      color: options.backgroundColor === '#ffffff' ? '1E1B4B' : 'FFFFFF',
      align: 'center',
    });

    if (options.author) {
      titleSlide.addText(`Prepared by ${options.author}`, {
        x: '10%',
        y: '55%',
        w: '80%',
        h: 0.8,
        fontSize: 18,
        color: options.backgroundColor === '#ffffff' ? '64748B' : 'CBD5E1',
        align: 'center',
      });
    }
  }

  // 2. Add each image as a slide
  for (let i = 0; i < items.length; i++) {
    if (onProgress) {
      onProgress(i + 1, items.length);
    }
    const item = items[i];
    const slide = pptx.addSlide();
    slide.background = { color: options.backgroundColor.replace('#', '') };

    // Read image as base64 data url for PptxGenJS embedding
    const base64Data = await fileToBase64(item.file);

    if (options.fitMode === 'cover') {
      // Full bleed cover layout
      slide.addImage({
        data: base64Data,
        x: 0,
        y: 0,
        w: '100%',
        h: '100%',
        sizing: { type: 'cover', w: '100%', h: '100%' },
      });
    } else if (options.fitMode === 'contain-caption') {
      // Image with caption bar below
      slide.addImage({
        data: base64Data,
        x: '5%',
        y: '8%',
        w: '90%',
        h: '75%',
        sizing: { type: 'contain', w: '90%', h: '75%' },
      });

      const captionText = item.caption || item.file.name.replace(/\.[^/.]+$/, '');
      slide.addText(captionText, {
        x: '5%',
        y: '85%',
        w: '90%',
        h: 0.6,
        fontSize: 14,
        align: 'center',
        color: options.backgroundColor === '#ffffff' ? '334155' : 'E2E8F0',
      });
    } else {
      // Standard contain fit
      slide.addImage({
        data: base64Data,
        x: '5%',
        y: '5%',
        w: '90%',
        h: '90%',
        sizing: { type: 'contain', w: '90%', h: '90%' },
      });
    }
  }

  // Export as Blob
  const output = await pptx.write({ outputType: 'blob' });
  return output as Blob;
}

/**
 * Helper to convert File to Base64 Data URL
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
