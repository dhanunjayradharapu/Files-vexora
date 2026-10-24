/**
 * File utility helpers for Vexora
 * Safe local file handling, size calculations, and downloads
 */

import JSZip from 'jszip';

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  if (bytes < 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const index = Math.min(i, sizes.length - 1);

  return `${parseFloat((bytes / Math.pow(k, index)).toFixed(dm))} ${sizes[index]}`;
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export function getFileNameWithoutExt(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return filename;
  return filename.substring(0, lastDot);
}

/**
 * Trigger browser download for a Blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Package multiple blobs into a ZIP file and trigger download
 */
export async function downloadZip(
  files: { name: string; blob: Blob }[],
  zipFilename: string = 'Vexora-archive.zip'
): Promise<void> {
  const zip = new JSZip();
  files.forEach((file) => {
    zip.file(file.name, file.blob);
  });
  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
  const cleanName = zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`;
  downloadBlob(content, cleanName);
}

/**
 * Validate image file format and size
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File, maxSizeBytes: number = 50 * 1024 * 1024): ValidationResult {
  const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'image/bmp'];
  const validExts = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif', 'bmp'];
  const ext = getFileExtension(file.name);

  if (!validMimes.includes(file.type) && !validExts.includes(ext)) {
    return {
      valid: false,
      error: `"${file.name}" is not a supported image format. Supported formats: JPG, PNG, WebP, GIF, BMP.`,
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File "${file.name}" is too large (${formatBytes(file.size)}). Maximum allowed size is ${formatBytes(maxSizeBytes)}.`,
    };
  }

  return { valid: true };
}
