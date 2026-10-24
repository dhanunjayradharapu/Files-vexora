# FileGenius - All-in-One Private File Tools

FileGenius is a modern, responsive web application offering high-performance, private in-browser image, PDF, and document utilities. All file processing runs 100% locally on the user's device using HTML5 Canvas, Blob APIs, `createImageBitmap`, `pdf-lib`, and `JSZip`—ensuring zero server uploads, complete confidentiality, and zero data tracking.

---

## Active Browser-Side Image & PDF Tools

1. **Interactive Image Crop (`#/tool/crop-image`)**
   - Interactive adjustable bounding crop area with corner drag handles and rule-of-thirds grid.
   - Aspect ratio presets: Free, 1:1 Square (Avatars/Posts), 16:9 Widescreen (YouTube/Hero), 4:3 Standard, 3:2 Photography, and 9:16 Story/Reel.
   - Manual pixel dimension inputs and live resolution calculation.
   - Exports to PNG, JPEG, or WebP.

2. **Image Dimension Presets & Resizer (`#/tool/image-resizer`)**
   - Platform dimension presets:
     - **Social Media**: Instagram Square (1080×1080), Instagram Story (1080×1920), YouTube Thumbnail (1280×720), Twitter Header (1500×500), Facebook Cover (820×312).
     - **Displays & Screens**: 4K Ultra HD (3840×2160), 2K QHD (2560×1440), Full HD (1920×1080), 720p HD (1280×720), SVGA (800×600).
   - Custom width & height with aspect ratio locking toggle.
   - Scale by percentage presets (25%, 50%, 75%, 200%).
   - Displays real-time technical metadata and resolution.

3. **Target-Size Image Compressor (`#/tool/image-compressor`)**
   - Set maximum target file size in **Bytes**, **KB**, or **MB**.
   - Bounded multi-pass search for encoding quality.
   - Optional dimension downscaling toggle if quality reduction alone cannot reach aggressive targets.
   - **Honest Verification**: Verifies `Blob.size` against requested target. If not reached, provides honest notice and immediate one-click dimension scaling.
   - **Transparency Protection**: Detects alpha channels in PNG/WebP files, explains JPEG format limitations, offers custom background fill color, or recommends WebP.

4. **Bulk Image Compressor (`#/tool/batch-compress`)**
   - Batch upload and compress up to 30 images simultaneously.
   - Individual before and after file size tracking with exact savings percentages.
   - Progress bar tracking batch execution.
   - Download individual files or **Download All as a ZIP Archive** using `JSZip`.

5. **Batch Format Converter (`#/tool/batch-converter`)**
   - Batch convert images to JPEG, PNG, or WebP.
   - Quality control slider for lossy formats.
   - Alpha transparency detection with background color filling for JPEG exports.
   - Individual download buttons or **Download All as a ZIP Archive**.

6. **Image Rotator & Mirror (`#/tool/image-rotator`)**
   - 90° clockwise, 90° counter-clockwise, 180° rotation, and fine 0–359° slider.
   - Horizontal and vertical flipping (mirroring).
   - Recalculates canvas bounding box so no edges or corners are clipped.
   - Technical metadata overview (resolution, color depth, alpha channel, aspect ratio).

7. **Image Inspector & Metadata (`#/tool/image-metadata`)**
   - Technical analysis of images: dimensions, file size (Bytes/KB/MB), aspect ratio, orientation, color architecture (24-bit RGB vs 32-bit RGBA), MIME type, and megapixels.
   - Direct quick-action shortcuts into Crop, Resize, Compress, or Convert workflows.

8. **Image to PDF Converter (`#/tool/image-to-pdf`)**
   - Combine multiple JPG, PNG, and WebP images into a unified PDF document.
   - Page reordering, per-page 90° rotations, custom PDF filename.
   - Page sizes (A4, US Letter, Fit to image), orientations (Auto, Portrait, Landscape), and margins.
   - Pure client-side PDF document authoring with `pdf-lib`.

---

## Architectural Principles

- **Zero-Server Processing**: All files stay in browser memory (`Blob`, `Canvas`, and `ArrayBuffer`).
- **Privacy Guaranteed**: No server uploads, no cookies, no tracking telemetry.
- **Single or Archive Export**: Download processed assets individually or grouped into `.zip` archives.
- **Responsive & Accessible**: Clean Plus Jakarta Sans typography, deep red accent palette (`#dc2626`), high contrast, keyboard navigation, and dark mode support with `localStorage` persistence.

---

## Getting Started

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

---

## Verification & Testing Instructions

1. **Testing Image Crop (`#/tool/crop-image`)**:
   - Upload any photo.
   - Drag the corner handles to resize the crop box or drag the center to move the crop area.
   - Click the **1:1 Square** or **16:9 Widescreen** preset. Notice dimensions update.
   - Click **Apply Crop** and download the resulting file.

2. **Testing Image Dimension Presets (`#/tool/image-resizer`)**:
   - Upload an image.
   - Under **Dimension Presets**, select "Social Media" and choose **Instagram Story (1080×1920)** or "HD & 4K Displays" and choose **Full HD (1920×1080)**.
   - Click **Resize Image** and download the output.

3. **Testing Target-Size Compression with Honesty Check (`#/tool/image-compressor`)**:
   - Upload an image (> 500 KB).
   - Test unit selector: switch between **Bytes**, **KB**, and **MB**.
   - Set target to `150 KB`.
   - Toggle "Allow dimension downscaling" and run compression.
   - Observe the verification card confirming whether the target was satisfied.

4. **Testing Bulk Compression & ZIP Download (`#/tool/batch-compress`)**:
   - Select 3–5 images at once.
   - Click **Compress Files** and observe individual progress.
   - Verify before/after sizes and savings percentages for each file.
   - Click **Download All as ZIP** and verify the `.zip` archive extracts properly.

5. **Testing Batch Converter (`#/tool/batch-converter`)**:
   - Select multiple PNG images.
   - Choose **WebP** as target format.
   - Click **Convert Files** and download the generated ZIP archive.

6. **Testing Image Inspector (`#/tool/image-metadata`)**:
   - Upload an image to view resolution, aspect ratio, megapixels, color depth, and alpha transparency.
