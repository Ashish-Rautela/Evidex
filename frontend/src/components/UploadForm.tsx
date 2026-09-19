import React, { useState, useRef } from 'react';
import { useUpload } from '../hooks/useUpload';

export function UploadForm({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const { uploadFile, isUploading, error } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === 'application/pdf') {
      setFile(dropped);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      await uploadFile(file);
      setFile(null);
      onUploadComplete?.();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div 
      onDragOver={(e) => e.preventDefault()} 
      onDrop={handleDrop}
      onClick={() => !file && fileInputRef.current?.click()}
      className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition ${!file ? 'cursor-pointer hover:bg-gray-100' : 'bg-gray-50'}`}
    >
      <input 
        type="file" 
        accept="application/pdf" 
        ref={fileInputRef} 
        onChange={handleChange} 
        className="hidden" 
      />
      {file ? (
        <div>
          <p className="font-semibold text-gray-700">{file.name}</p>
          <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          <button 
            onClick={handleUpload} 
            disabled={isUploading}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
          <p className="text-gray-500 font-medium">Drag and drop a PDF file here, or click to select</p>
        </div>
      )}
      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
    </div>
  );
}
