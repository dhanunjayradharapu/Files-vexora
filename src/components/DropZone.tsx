import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { validateImageFile, formatBytes } from '../utils/fileUtils';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  acceptedMimeTypes?: string[];
  multiple?: boolean;
  maxFiles?: number;
  maxSizeBytes?: number;
  title?: string;
  subtitle?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  accept = 'image/jpeg,image/png,image/webp,image/gif,image/bmp',
  acceptedMimeTypes,
  multiple = false,
  maxFiles = 50,
  maxSizeBytes = 100 * 1024 * 1024,
  title = 'Select or drop your files here',
  subtitle = 'Supports local file processing up to 100MB per file',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveAccept = acceptedMimeTypes && acceptedMimeTypes.length > 0
    ? acceptedMimeTypes.join(',')
    : accept;

  const handleFiles = (incomingFileList: FileList | null) => {
    if (!incomingFileList || incomingFileList.length === 0) return;
    setErrorMessage(null);

    const filesArray = Array.from(incomingFileList);
    const validFiles: File[] = [];

    const isPdfMode = effectiveAccept.includes('pdf');

    for (const file of filesArray) {
      if (isPdfMode) {
        const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
        if (!isPdf) {
          setErrorMessage(`"${file.name}" is not a valid PDF file.`);
          return;
        }
        if (file.size > maxSizeBytes) {
          setErrorMessage(`File "${file.name}" is too large (${formatBytes(file.size)}).`);
          return;
        }
      } else {
        const validation = validateImageFile(file, maxSizeBytes);
        if (!validation.valid) {
          setErrorMessage(validation.error || 'Invalid file');
          return;
        }
      }

      validFiles.push(file);
      if (!multiple) break;
    }

    if (validFiles.length > maxFiles) {
      setErrorMessage(`Please select at most ${maxFiles} files at once.`);
      return;
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // Support paste from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      const pastedFiles: File[] = [];

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            pastedFiles.push(file);
          }
        }
      }

      if (pastedFiles.length > 0) {
        const dataTransfer = new DataTransfer();
        pastedFiles.forEach((f) => dataTransfer.items.add(f));
        handleFiles(dataTransfer.files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`group relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
          isDragOver
            ? 'border-indigo-600 bg-indigo-100/70 dark:bg-indigo-950/40 scale-[0.99]'
            : 'border-indigo-300 dark:border-indigo-800/80 bg-[#EEF2FF] dark:bg-slate-900/80 hover:border-indigo-500 hover:bg-[#E0E7FF]/60 dark:hover:bg-slate-850'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={effectiveAccept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            // Reset input so same file can be selected again if needed
            if (e.target) e.target.value = '';
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
              isDragOver
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 shadow-sm'
            }`}
          >
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg sm:text-xl font-semibold text-[#1E1B4B] dark:text-white">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/25 active:scale-95 transition-all pointer-events-none"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Choose {multiple ? 'Files' : 'Image'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
            <span>Supports drag & drop</span>
            <span aria-hidden="true">·</span>
            <span>Paste directly (Ctrl+V)</span>
            <span aria-hidden="true">·</span>
            <span>Max {formatBytes(maxSizeBytes)}</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-lg flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
