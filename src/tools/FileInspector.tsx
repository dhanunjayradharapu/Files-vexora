import React, { useState, useRef } from 'react';
import {
  FileCheck,
  Upload,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  Info,
  Download,
  AlertCircle,
  Hash,
  Binary,
  Layers,
  Sparkles
} from 'lucide-react';
import { inspectFileMetadata, FileMetadataResult } from '../utils/metadataUtils';
import { formatBytes } from '../utils/fileUtils';

export const FileInspector: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<FileMetadataResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    await processFile(selectedFile);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    await processFile(droppedFile);
  };

  const processFile = async (selectedFile: File) => {
    try {
      setIsLoading(true);
      setError(null);
      setMetadata(null);
      setFile(selectedFile);

      const result = await inspectFileMetadata(selectedFile);
      setMetadata(result);
    } catch (err: unknown) {
      console.error(err);
      setError('Could not inspect file metadata.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadJsonMetadata = () => {
    if (!metadata) return;
    const jsonStr = JSON.stringify(metadata, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.fileName}_metadata.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setMetadata(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-400 text-xs font-semibold mb-3">
          <FileCheck className="w-3.5 h-3.5" />
          Deep File Inspector & Hashes
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E1B4B] dark:text-white tracking-tight">
          File Information & Metadata
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
          Analyze internal document metadata, compute cryptographic SHA-256 hashes, and verify magic byte signatures.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {!file && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-indigo-300 dark:border-indigo-800/80 hover:border-indigo-500 bg-indigo-50/40 dark:bg-slate-900 hover:bg-indigo-50/70 transition-all rounded-3xl p-12 text-center cursor-pointer max-w-2xl mx-auto shadow-sm"
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200 dark:shadow-none">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#1E1B4B] dark:text-white mb-2">Select Any File to Inspect</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Upload PDF, Word, PowerPoint, Image, or binary documents to view cryptographic hashes and internal metadata.
          </p>
          <button
            type="button"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-100 dark:shadow-none transition-all text-sm inline-flex items-center gap-2"
          >
            Choose File
          </button>
        </div>
      )}

      {isLoading && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-md mx-auto">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-[#1E1B4B] dark:text-white">Calculating cryptographic hash and inspecting headers...</p>
        </div>
      )}

      {metadata && !isLoading && (
        <div className="space-y-6">
          {/* Top Info Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#1E1B4B] dark:text-white text-base truncate max-w-md">
                  {metadata.fileName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {metadata.fileSizeBytes} &bull; {metadata.detectedMimeType} &bull; Modified: {metadata.lastModifiedDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadJsonMetadata}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Inspect Another File
              </button>
            </div>
          </div>

          {/* Security / Mismatch Warnings */}
          {metadata.warnings.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Format Observation Notices</span>
              </div>
              <ul className="list-disc pl-5 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                {metadata.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Cryptographic Checksums Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-[#1E1B4B] dark:text-white text-sm flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-600" />
              Cryptographic Integrity Hashes
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    SHA-256 Checksum
                  </span>
                  <p className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold truncate select-all">
                    {metadata.sha256}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(metadata.sha256, 'sha256')}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0 flex items-center gap-1"
                >
                  {copiedKey === 'sha256' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'sha256' ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Header Magic Bytes (Hex)
                  </span>
                  <p className="font-mono text-xs text-slate-700 dark:text-slate-300 font-semibold truncate select-all">
                    {metadata.magicHeader}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(metadata.magicHeader, 'magic')}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0 flex items-center gap-1"
                >
                  {copiedKey === 'magic' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'magic' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Metadata Key-Values Grid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-[#1E1B4B] dark:text-white text-sm flex items-center gap-2">
              <Binary className="w-4 h-4 text-indigo-600" />
              Internal Format Properties
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(metadata.details).map(([key, val]) => (
                <div
                  key={key}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{key}</span>
                  <span className="text-xs font-bold text-[#1E1B4B] dark:text-white font-mono truncate max-w-[200px]">
                    {String(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
