/**
 * Tool definitions and registry for Vexora
 */

export type ToolCategory = 'pdf' | 'image' | 'powerpoint' | 'document';
export type ToolStatus = 'ready' | 'coming-soon';

export interface ToolDef {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  category: ToolCategory;
  status: ToolStatus;
  iconName: string;
  popular?: boolean;
  tags: string[];
  acceptedFormats: string;
  maxFiles?: number;
}

export const CATEGORIES: { id: ToolCategory; label: string; count: number }[] = [
  { id: 'pdf', label: 'PDF Tools', count: 12 },
  { id: 'image', label: 'Image Tools', count: 8 },
  { id: 'powerpoint', label: 'PowerPoint Tools', count: 3 },
  { id: 'document', label: 'Document Tools', count: 5 },
];

export const TOOLS: ToolDef[] = [
  // ==========================================
  // PDF TOOLS (12 Client-side Tools)
  // ==========================================
  {
    id: 'merge-pdf',
    title: 'Merge PDF',
    shortDescription: 'Combine multiple PDF files into a single, unified document in any order.',
    description: 'Merge several PDF files into one clean document with reordering controls, live page counts, and full vector preservation.',
    category: 'pdf',
    status: 'ready',
    iconName: 'FileArchive',
    popular: true,
    tags: ['merge pdf', 'combine pdf', 'join pdf', 'bind pdf', 'concatenate'],
    acceptedFormats: 'application/pdf,.pdf',
    maxFiles: 30,
  },
  {
    id: 'split-pdf',
    title: 'Split PDF',
    shortDescription: 'Split a PDF into separate files by custom ranges or extract every N pages.',
    description: 'Separate single or multiple pages from your PDF file. Download individual split files or all pages packaged as a ZIP archive.',
    category: 'pdf',
    status: 'ready',
    iconName: 'Scissors',
    popular: true,
    tags: ['split pdf', 'cut pdf', 'divide pdf', 'page ranges', 'separate pages'],
    acceptedFormats: 'application/pdf,.pdf',
    maxFiles: 1,
  },
  {
    id: 'extract-pdf',
    title: 'Extract PDF Pages',
    shortDescription: 'Select specific pages using visual thumbnails and export them into a new PDF.',
    description: 'Click on page thumbnails or enter range strings (e.g. 1-3, 5) to isolate only the pages you need with zero loss of vector sharpness.',
    category: 'pdf',
    status: 'ready',
    iconName: 'Copy',
    popular: true,
    tags: ['extract pages', 'select pages', 'pull pages', 'export pages'],
    acceptedFormats: 'application/pdf,.pdf',
    maxFiles: 1,
  },
  {
    id: 'rotate-pdf',
    title: 'Rotate PDF',
    shortDescription: 'Rotate individual pages or entire documents 90°, 180°, or 270° clockwise.',
    description: 'Permanently orient landscape or portrait pages. Rotate individual pages or bulk-rotate every page with live thumbnail preview.',
    category: 'pdf',
    status: 'ready',
    iconName: 'RotateCw',
    popular: true,
    tags: ['rotate pdf', 'turn pages', 'fix orientation', 'upside down pdf'],
    acceptedFormats: 'application/pdf,.pdf',
    maxFiles: 1,
  },
  {
    id: 'organize-pdf',
    title: 'Organize PDF Pages',
    shortDescription: 'Reorder, duplicate, or delete pages with an intuitive visual thumbnail interface.',
    description: 'Rearrange your PDF pages freely. Move pages left or right, duplicate presentation slides, or eliminate unwanted blank pages.',
    category: 'pdf',
    status: 'ready',
    iconName: 'Layers',
    popular: true,
    tags: ['reorder pdf', 'organize pages', 'sort pages', 'duplicate page', 'delete page'],
    acceptedFormats: 'application/pdf,.pdf',
    maxFiles: 1,
  },
  {
    id: 'pdf-to-jpg',
    title: 'PDF to JPG',
    shortDescription: 'Render every PDF page into crisp, high-resolution JPEG images with quality control.',
    description: 'Convert PDF document pages to JPG images at customizable DPI scales (108, 144, 216 DPI) and adjustable JPEG compression quality.',
    category: 'pdf',
    status: 'ready',
    iconName: 'FileImage',
    popular: true,
    tags: ['pdf to jpg', 'pdf to jpeg', 'pdf to picture', 'convert pdf to image'],
    acceptedFormats: 'application/pdf,.pdf',
    maxFiles: 1,
  },
  {
    id: 'pdf-to-png',
    title: 'PDF to PNG',
    shortDescription: 'Convert PDF pages into lossless, pixel-perfect PNG images with transparency support.',
    description: 'Extract PDF pages as lossless PNG images. Ideal for text documents, schematics, engineering charts, and presentation graphics.',
    category: 'pdf',
    status: 'ready',
    iconName: 'Image',
    popular: true,
    tags: ['pdf to png', 'lossless pdf to image', 'high res pdf image'],
    acceptedFormats: 'application/pdf,.pdf',
    maxFiles: 1,
  },
  {
    id: 'image-to-pdf',
    title: 'Image to PDF',
    shortDescription: 'Convert JPG, PNG, and WebP images to a professional PDF document in seconds.',
    description: 'Combine multiple images into a single polished PDF. Adjust page size (Fit, A4, Letter), orientation, margins, and reorder images easily.',
    category: 'pdf',
    status: 'ready',
    iconName: 'FileText',
    popular: true,
    tags: ['jpg to pdf', 'png to pdf', 'images to pdf', 'convert', 'merge images'],
    acceptedFormats: 'image/jpeg,image/png,image/webp,image/gif,image/bmp',
    maxFiles: 50,
  },
  {
    id: 'pdf-page-numbers',
    title: 'Add Page Numbers',
    shortDescription: 'Insert header and footer page numbers with custom positions, fonts, and styles.',
    description: 'Number your PDF pages cleanly. Choose from 6 positions, format as "Page X of Y", customize margins, and skip cover pages.',
    category: 'pdf',
    status: 'ready',
    iconName: 'Hash',
    tags: ['page numbers', 'number pdf', 'header footer', 'paginate pdf'],
    acceptedFormats: 'application/pdf,.pdf',
    maxFiles: 1,
  },
  {
    id: 'pdf-watermark',
    title: 'Add Watermark',
    shortDescription: 'Stamp text watermarks across pages with custom angles, colors, and opacity.',
    description: 'Add "CONFIDENTIAL", "DRAFT", or custom branding stamps. Choose diagonal angles or tiled repetition with live thumbnail preview.',
    category: 'pdf',
    status: 'ready',
    iconName: 'Stamp',
    tags: ['watermark', 'stamp pdf', 'confidential', 'draft', 'protect pdf'],
    acceptedFormats: 'application/pdf,.pdf',
    maxFiles: 1,
  },
  {
    id: 'pdf-add-image',
    title: 'Add Image / Signature',
    shortDescription: 'Insert digital signatures, official stamps, logos, or letterheads onto any page.',
    description: 'Embed PNG or JPG signatures onto the last page, first page, or all pages with adjustable scale, placement, and opacity.',
    category: 'pdf',
    status: 'ready',
    iconName: 'PenTool',
    tags: ['sign pdf', 'stamp pdf', 'add signature', 'insert image', 'logo to pdf'],
    acceptedFormats: 'application/pdf,.pdf',
    maxFiles: 1,
  },
  {
    id: 'compress-pdf',
    title: 'Compress & Optimize PDF',
    shortDescription: 'Restructure PDF cross-reference tables and strip unneeded metadata trees directly in browser.',
    description: 'Shrink bulky PDF files via client-side object stream restructuring and metadata dictionary pruning while preserving 100% vector sharpness.',
    category: 'pdf',
    status: 'ready',
    iconName: 'FileDown',
    popular: true,
    tags: ['compress pdf', 'shrink pdf', 'reduce pdf size', 'optimize pdf', 'stream compression'],
    acceptedFormats: 'application/pdf,.pdf',
    maxFiles: 10,
  },

  // ==========================================
  // IMAGE TOOLS (8 Client-side Tools)
  // ==========================================
  {
    id: 'crop-image',
    title: 'Image Crop',
    shortDescription: 'Crop photos with an interactive bounding box and aspect ratio presets (1:1, 16:9, 4:3, etc.).',
    description: 'Adjust crop area smoothly with interactive corner handles, exact dimensions preview, custom or locked ratios, and instant export.',
    category: 'image',
    status: 'ready',
    iconName: 'Crop',
    popular: true,
    tags: ['crop', 'trim', 'cut image', 'aspect ratio crop', 'square crop', 'avatar'],
    acceptedFormats: 'image/jpeg,image/png,image/webp,image/bmp',
    maxFiles: 1,
  },
  {
    id: 'image-resizer',
    title: 'Image Resizer',
    shortDescription: 'Resize images with dimension presets (Instagram, YouTube, HD, 4K) or custom width/height.',
    description: 'Change image dimensions with pixel precision, popular platform presets (Story, Post, Header, 1080p, 4K), and aspect ratio constraint.',
    category: 'image',
    status: 'ready',
    iconName: 'Maximize2',
    popular: true,
    tags: ['resize', 'scale', 'dimensions', 'resolution', 'presets', 'hd', '4k'],
    acceptedFormats: 'image/jpeg,image/png,image/webp,image/bmp',
    maxFiles: 1,
  },
  {
    id: 'image-compressor',
    title: 'Image Compressor',
    shortDescription: 'Compress images to target size in Bytes, KB, or MB with bounded search and honest size confirmation.',
    description: 'Reduce image file size while keeping visual clarity. Set a target size in Bytes, KB, or MB with adaptive multi-stage quality and resolution optimization.',
    category: 'image',
    status: 'ready',
    iconName: 'Minimize2',
    popular: true,
    tags: ['compress', 'shrink', 'reduce size', 'optimize', 'target size kb mb bytes'],
    acceptedFormats: 'image/jpeg,image/png,image/webp',
    maxFiles: 1,
  },
  {
    id: 'batch-compress',
    title: 'Bulk Image Compressor',
    shortDescription: 'Compress multiple images in batch with individual before/after file sizes and ZIP download.',
    description: 'Upload up to 30 images and compress them simultaneously. See individual savings for every photo and download individually or packaged in a ZIP archive.',
    category: 'image',
    status: 'ready',
    iconName: 'Layers',
    popular: true,
    tags: ['bulk compress', 'batch compress', 'compress multiple', 'zip download'],
    acceptedFormats: 'image/jpeg,image/png,image/webp',
    maxFiles: 30,
  },
  {
    id: 'image-converter',
    title: 'Image Format Converter',
    shortDescription: 'Convert images between JPEG, PNG, and WebP formats right in your browser.',
    description: 'Switch image formats quickly. Convert PNG to JPG with background handling, or turn images into modern lightweight WebP.',
    category: 'image',
    status: 'ready',
    iconName: 'Repeat',
    popular: true,
    tags: ['convert image', 'png to jpg', 'jpg to png', 'webp converter', 'format'],
    acceptedFormats: 'image/jpeg,image/png,image/webp,image/gif,image/bmp',
    maxFiles: 1,
  },
  {
    id: 'batch-converter',
    title: 'Batch Format Converter',
    shortDescription: 'Convert multiple images at once to JPG, PNG, or WebP with individual progress and ZIP export.',
    description: 'Batch convert dozens of files to JPG, PNG, or WebP. Transparent alpha channel warnings with individual download links or 1-click ZIP archive.',
    category: 'image',
    status: 'ready',
    iconName: 'Sliders',
    popular: true,
    tags: ['batch convert', 'bulk convert', 'multiple convert', 'zip download', 'png to webp batch'],
    acceptedFormats: 'image/jpeg,image/png,image/webp,image/gif,image/bmp',
    maxFiles: 30,
  },
  {
    id: 'image-rotator',
    title: 'Image Rotator & Flip',
    shortDescription: 'Rotate images by 90°, 180°, or custom angles, and flip horizontally or vertically.',
    description: 'Fix portrait/landscape orientation mistakes or flip photos with high-fidelity canvas rendering that never clips content.',
    category: 'image',
    status: 'ready',
    iconName: 'RotateCw',
    popular: true,
    tags: ['rotate', 'flip', 'mirror', 'turn image', 'orientation', 'metadata'],
    acceptedFormats: 'image/jpeg,image/png,image/webp,image/bmp',
    maxFiles: 1,
  },
  {
    id: 'image-metadata',
    title: 'Image Inspector & Metadata',
    shortDescription: 'Inspect image dimensions, file size, color depth, alpha transparency, and megapixels.',
    description: 'Deep technical overview of any graphic or photograph. Verify exact pixel dimensions, aspect ratio, transparency channels, and size in Bytes/KB/MB.',
    category: 'image',
    status: 'ready',
    iconName: 'FileImage',
    tags: ['metadata', 'exif', 'dimensions', 'inspector', 'color depth', 'megapixels'],
    acceptedFormats: 'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml',
    maxFiles: 1,
  },

  // ==========================================
  // POWERPOINT TOOLS (3 Client-side Tools)
  // ==========================================
  {
    id: 'extract-pptx-images',
    title: 'Extract Images from PowerPoint',
    shortDescription: 'Unpack modern PPTX presentations and extract embedded photos and media as high-res images or ZIP.',
    description: 'Inspect internal OpenXML package media folders using JSZip and download embedded presentation graphics individually or as a single ZIP archive.',
    category: 'powerpoint',
    status: 'ready',
    iconName: 'Presentation',
    popular: true,
    tags: ['extract pptx images', 'powerpoint to images', 'extract slides pictures', 'pptx media'],
    acceptedFormats: '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation',
    maxFiles: 1,
  },
  {
    id: 'images-to-pptx',
    title: 'Images to PowerPoint',
    shortDescription: 'Create a clean, downloadable PPTX presentation from selected images using PptxGenJS.',
    description: 'Turn photo collections, design boards, and charts into presentation slides. Customize widescreen 16:9 or standard 4:3 layouts, fit modes, captions, and slide backgrounds.',
    category: 'powerpoint',
    status: 'ready',
    iconName: 'Presentation',
    popular: true,
    tags: ['images to ppt', 'create pptx', 'photos to presentation', 'pptxgenjs', 'slideshow'],
    acceptedFormats: 'image/*',
    maxFiles: 50,
  },
  {
    id: 'preview-pptx',
    title: 'PowerPoint Slide & Text Inspector',
    shortDescription: 'Preview slide titles, body copy, and presenter speaker notes from OpenXML PPTX files.',
    description: 'Read and extract slide-by-slide text content and speaker notes directly in your browser. Copy text or export complete presentation transcripts as TXT.',
    category: 'powerpoint',
    status: 'ready',
    iconName: 'BookOpen',
    tags: ['preview pptx', 'read powerpoint', 'extract presentation text', 'speaker notes'],
    acceptedFormats: '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation',
    maxFiles: 1,
  },

  // ==========================================
  // DOCUMENT TOOLS (5 Client-side Tools)
  // ==========================================
  {
    id: 'text-to-pdf',
    title: 'Plain Text to PDF',
    shortDescription: 'Convert plain text files, logs, or markdown into clean, paginated PDF documents.',
    description: 'Transform TXT, MD, CSV, or code files into multi-page vector PDFs with custom typography (Helvetica, Times, Courier), line numbering, and page margins.',
    category: 'document',
    status: 'ready',
    iconName: 'FileText',
    popular: true,
    tags: ['txt to pdf', 'text to pdf', 'convert text', 'log to pdf', 'code to pdf'],
    acceptedFormats: '.txt,.md,.log,.csv,.json,.xml,text/plain',
    maxFiles: 1,
  },
  {
    id: 'pdf-extract-text',
    title: 'Extract Text from PDF',
    shortDescription: 'Extract selectable digital text from PDF files using PDF.js with search and word counts.',
    description: 'Isolate text layers from PDF documents. Search keywords, copy page-by-page transcripts, and export entire document text as a clean TXT file.',
    category: 'document',
    status: 'ready',
    iconName: 'BookOpen',
    popular: true,
    tags: ['extract text from pdf', 'pdf to txt', 'read pdf text', 'copy pdf text'],
    acceptedFormats: 'application/pdf,.pdf',
    maxFiles: 1,
  },
  {
    id: 'docx-to-pdf',
    title: 'Word (DOCX) to PDF',
    shortDescription: 'Convert Microsoft Word DOCX files to clean, paginated PDF documents directly in your browser.',
    description: 'Parse DOCX OpenXML structures via Mammoth and generate standardized vector PDFs with preserved headings, paragraphs, bullet lists, and typography.',
    category: 'document',
    status: 'ready',
    iconName: 'FileText',
    popular: true,
    tags: ['docx to pdf', 'word to pdf', 'convert docx', 'microsoft word pdf'],
    acceptedFormats: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    maxFiles: 1,
  },
  {
    id: 'editor-to-pdf',
    title: 'Document Editor to PDF',
    shortDescription: 'Type or paste text directly into an editor and generate clean, formatted PDF documents.',
    description: 'Compose proposals, memos, letters, or reports in a streamlined editor with real-time page estimation and instant PDF generation.',
    category: 'document',
    status: 'ready',
    iconName: 'PenTool',
    tags: ['write pdf', 'create pdf', 'editor to pdf', 'compose document', 'pdf memo'],
    acceptedFormats: '',
    maxFiles: 0,
  },
  {
    id: 'file-inspector',
    title: 'File Information & Metadata',
    shortDescription: 'Analyze internal document metadata, compute cryptographic SHA-256 hashes, and verify magic bytes.',
    description: 'Inspect any file format. View SHA-256 checksums, verify header magic signatures, and extract deep format properties for PDF, Word, PowerPoint, and images.',
    category: 'document',
    status: 'ready',
    iconName: 'FileCheck',
    popular: true,
    tags: ['file info', 'metadata', 'sha256', 'magic bytes', 'file inspector', 'hash'],
    acceptedFormats: '*/*',
    maxFiles: 1,
  },
];

export function getToolById(id: string): ToolDef | undefined {
  return TOOLS.find((t) => t.id === id);
}

export function searchTools(query: string, category?: ToolCategory): ToolDef[] {
  const normalized = query.trim().toLowerCase();
  return TOOLS.filter((tool) => {
    const matchesCategory = !category || tool.category === category;
    if (!matchesCategory) return false;
    if (!normalized) return true;

    return (
      tool.title.toLowerCase().includes(normalized) ||
      tool.shortDescription.toLowerCase().includes(normalized) ||
      tool.tags.some((tag) => tag.toLowerCase().includes(normalized))
    );
  });
}
