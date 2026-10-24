/**
 * Image processing utilities for Vexora
 * Uses HTML5 Canvas, Blob, and createImageBitmap APIs entirely client-side
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface DetailedImageMetadata extends ImageDimensions {
  name: string;
  size: number;
  type: string;
  aspectRatio: number;
  aspectRatioText: string;
  megapixels: number;
  hasAlpha: boolean;
  colorDepth: string;
  orientation: 'landscape' | 'portrait' | 'square';
  lastModified?: number;
}

/**
 * Loads an HTMLImageElement from a File or Blob safely
 */
export function loadImageFromFile(file: File | Blob): Promise<{ img: HTMLImageElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      resolve({ img, objectUrl });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image. The file may be corrupted or in an unsupported format.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Check if an image contains transparent pixels
 */
export function checkImageTransparency(img: HTMLImageElement): boolean {
  try {
    const canvas = document.createElement('canvas');
    // Sample at smaller size for fast performance
    const sampleWidth = Math.min(img.naturalWidth, 400);
    const sampleHeight = Math.min(img.naturalHeight, 400);
    canvas.width = Math.max(1, sampleWidth);
    canvas.height = Math.max(1, sampleHeight);

    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight);
    const imgData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
    const data = imgData.data;

    // Check alpha values (index 3, 7, 11...)
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 250) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Calculates a human-friendly aspect ratio text (e.g. 16:9, 4:3, 1:1)
 */
export function calculateAspectRatioText(width: number, height: number): string {
  if (width === 0 || height === 0) return '1:1';
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(Math.round(width), Math.round(height));
  const wRatio = Math.round(width / divisor);
  const hRatio = Math.round(height / divisor);
  if (wRatio > 50 || hRatio > 50) {
    return `${(width / height).toFixed(2)}:1`;
  }
  return `${wRatio}:${hRatio}`;
}

/**
 * Extract comprehensive image metadata
 */
export async function extractDetailedMetadata(
  file: File
): Promise<{ metadata: DetailedImageMetadata; img: HTMLImageElement; objectUrl: string }> {
  const { img, objectUrl } = await loadImageFromFile(file);
  const hasAlpha = checkImageTransparency(img);
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  const megapixels = parseFloat(((width * height) / 1000000).toFixed(2));
  const aspectRatio = width / (height || 1);
  const aspectRatioText = calculateAspectRatioText(width, height);
  const orientation = width > height ? 'landscape' : width < height ? 'portrait' : 'square';
  const colorDepth = hasAlpha ? '32-bit (RGBA)' : '24-bit (RGB)';

  return {
    metadata: {
      name: file.name,
      size: file.size,
      type: file.type || 'image/jpeg',
      width,
      height,
      aspectRatio,
      aspectRatioText,
      megapixels,
      hasAlpha,
      colorDepth,
      orientation,
      lastModified: file.lastModified,
    },
    img,
    objectUrl,
  };
}

/**
 * Convert canvas to Blob with fallback
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string = 'image/jpeg',
  quality: number = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to process image canvas'));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Resize an image with high quality smoothing
 */
export async function resizeImage(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  mimeType: string = 'image/jpeg',
  quality: number = 0.92,
  backgroundColor?: string
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(targetWidth));
  canvas.height = Math.max(1, Math.round(targetHeight));

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is not available');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (mimeType === 'image/jpeg') {
    // JPEG doesn't support transparency, default to white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvasToBlob(canvas, mimeType, quality);
}

/**
 * Crop an image to specified rectangular coordinates
 */
export async function cropImage(
  img: HTMLImageElement,
  cropX: number,
  cropY: number,
  cropWidth: number,
  cropHeight: number,
  mimeType: string = 'image/png',
  quality: number = 0.95,
  backgroundColor?: string
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const finalW = Math.max(1, Math.round(cropWidth));
  const finalH = Math.max(1, Math.round(cropHeight));

  canvas.width = finalW;
  canvas.height = finalH;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is not available');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(
    img,
    Math.round(cropX),
    Math.round(cropY),
    Math.round(cropWidth),
    Math.round(cropHeight),
    0,
    0,
    finalW,
    finalH
  );

  return canvasToBlob(canvas, mimeType, quality);
}

export interface CompressionResult {
  blob: Blob;
  actualBytes: number;
  targetReached: boolean;
  qualityUsed: number;
  widthUsed: number;
  heightUsed: number;
  savingsBytes: number;
  savingsPercentage: number;
  dimensionScaled: boolean;
  cannotReachWithoutResize?: boolean;
}

/**
 * Iterative smart compressor to reach target size in bytes.
 * Bounded search for encoding quality and optionally resizes dimensions if allowed.
 */
export async function compressImageToTarget(
  img: HTMLImageElement,
  originalBytes: number,
  targetBytes: number,
  mimeType: 'image/jpeg' | 'image/webp' = 'image/jpeg',
  backgroundColor?: string,
  allowDimensionScaling: boolean = true
): Promise<CompressionResult> {
  let lowQ = 0.05;
  let highQ = 0.95;
  let bestBlob: Blob | null = null;
  let bestBytes = Infinity;
  let bestQ = 0.8;
  let currentWidth = img.naturalWidth;
  let currentHeight = img.naturalHeight;
  let dimensionScaled = false;

  // First pass: try adjusting quality at original dimensions
  for (let iteration = 0; iteration < 8; iteration++) {
    const q = (lowQ + highQ) / 2;
    const blob = await resizeImage(img, currentWidth, currentHeight, mimeType, q, backgroundColor);

    if (blob.size <= targetBytes) {
      bestBlob = blob;
      bestBytes = blob.size;
      bestQ = q;
      // Target reached, try to refine quality higher
      lowQ = q;
    } else {
      highQ = q;
    }
  }

  // If quality reduction alone couldn't reach target and scaling is allowed:
  if ((!bestBlob || bestBytes > targetBytes) && allowDimensionScaling) {
    dimensionScaled = true;
    let scale = 0.9;
    while (scale >= 0.15) {
      currentWidth = Math.max(1, Math.round(img.naturalWidth * scale));
      currentHeight = Math.max(1, Math.round(img.naturalHeight * scale));
      const testQ = 0.7;
      const blob = await resizeImage(img, currentWidth, currentHeight, mimeType, testQ, backgroundColor);

      if (blob.size <= targetBytes) {
        bestBlob = blob;
        bestBytes = blob.size;
        bestQ = testQ;
        break;
      }
      scale -= 0.12;
    }
  }

  // Fallback if still not reached
  if (!bestBlob) {
    const minQ = 0.15;
    bestBlob = await resizeImage(img, currentWidth, currentHeight, mimeType, minQ, backgroundColor);
    bestBytes = bestBlob.size;
    bestQ = minQ;
  }

  const targetReached = bestBytes <= targetBytes;
  const savingsBytes = originalBytes - bestBytes;
  const savingsPercentage = originalBytes > 0 ? ((originalBytes - bestBytes) / originalBytes) * 100 : 0;

  return {
    blob: bestBlob,
    actualBytes: bestBytes,
    targetReached,
    qualityUsed: Math.round(bestQ * 100) / 100,
    widthUsed: currentWidth,
    heightUsed: currentHeight,
    savingsBytes,
    savingsPercentage: Math.max(0, Math.round(savingsPercentage * 10) / 10),
    dimensionScaled,
    cannotReachWithoutResize: !targetReached && !allowDimensionScaling,
  };
}

/**
 * Rotate and flip image with exact bounding box recalculation
 */
export async function rotateAndFlipImage(
  img: HTMLImageElement,
  rotationAngleDegrees: number,
  flipHorizontal: boolean = false,
  flipVertical: boolean = false,
  mimeType: string = 'image/png',
  quality: number = 0.95,
  backgroundColor?: string
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is not available');

  const radians = (rotationAngleDegrees * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));

  const origWidth = img.naturalWidth;
  const origHeight = img.naturalHeight;

  // Recalculate bounding box so nothing gets clipped
  const newWidth = Math.round(origWidth * cos + origHeight * sin);
  const newHeight = Math.round(origWidth * sin + origHeight * cos);

  canvas.width = Math.max(1, newWidth);
  canvas.height = Math.max(1, newHeight);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Center coordinate space
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(radians);

  // Apply flips
  const scaleX = flipHorizontal ? -1 : 1;
  const scaleY = flipVertical ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  // Draw image centered
  ctx.drawImage(img, -origWidth / 2, -origHeight / 2, origWidth, origHeight);
  ctx.restore();

  return canvasToBlob(canvas, mimeType, quality);
}
