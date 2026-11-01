'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { UploadCloud, X, Loader2, Image as ImageIcon, Link as LinkIcon, CheckCircle2, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
}

export function ImageUpload({
  value,
  onChange,
  label = 'Item Photo',
  helperText = 'Upload a clear photo from your device, or paste a URL.',
}: ImageUploadProps) {
  const [mode, setMode] = useState<'upload' | 'url'>(value && !value.includes('/storage/buckets/') ? 'url' : 'upload');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WebP, GIF).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB.');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload photo.');
      }

      // Use the preview URL or view URL
      onChange(data.url);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again or paste a URL.');
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }

  function handleDrag(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  function handleRemove() {
    onChange('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-stone-700 block">
          {label}
        </label>
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded-md transition ${
              mode === 'upload'
                ? 'bg-emerald-100 text-emerald-800 font-bold'
                : 'text-stone-700 hover:text-stone-900 font-medium'
            }`}
          >
            Upload to Appwrite
          </button>
          <span className="text-stone-400">|</span>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded-md transition ${
              mode === 'url'
                ? 'bg-emerald-100 text-emerald-800 font-bold'
                : 'text-stone-700 hover:text-stone-900 font-medium'
            }`}
          >
            Image URL
          </button>
        </div>
      </div>

      {/* Preview if image is present */}
      {value ? (
        <div className="relative rounded-2xl border border-stone-200 overflow-hidden bg-stone-50 group">
          <div className="h-48 w-full flex items-center justify-center bg-stone-100 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Listing preview"
              className="w-full h-full object-cover"
              onError={() => setError('Failed to load image preview from URL.')}
            />
          </div>

          <div className="absolute top-2 right-2 flex items-center gap-2">
            <span className="px-2 py-1 rounded-lg bg-emerald-900/80 text-white text-[10px] font-semibold backdrop-blur-xs flex items-center gap-1 shadow-xs">
              <CheckCircle2 className="w-3 h-3 text-emerald-300" />
              {value.includes('/storage/buckets/') ? 'Appwrite Bucket' : 'Web URL'}
            </span>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-lg bg-white/90 text-stone-700 hover:bg-red-50 hover:text-red-700 transition shadow-xs"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : mode === 'upload' ? (
        /* Drag & Drop Upload Zone */
        <div>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
              dragActive
                ? 'border-emerald-600 bg-emerald-50/50'
                : 'border-stone-300 hover:border-emerald-600 hover:bg-stone-50'
            } ${uploading ? 'pointer-events-none opacity-70' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={handleFileChange}
              className="hidden"
            />

            {uploading ? (
              <div className="flex flex-col items-center justify-center py-4 text-emerald-700">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-xs font-bold">Uploading to Appwrite Storage...</p>
                <p className="text-xs text-stone-600 font-medium mt-0.5">Optimizing and storing image</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-3 text-stone-700">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-stone-900">
                  Click to upload or drag & drop photo
                </p>
                <p className="text-xs text-stone-600 font-medium mt-0.5">
                  JPG, PNG, WebP or GIF up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Direct URL Input Mode */
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input
            type="url"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://images.unsplash.com/photo-..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 bg-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
          />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 pt-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-stone-600 font-medium">{helperText}</p>
    </div>
  );
}

