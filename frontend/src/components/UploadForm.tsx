import { useState, useRef } from 'react';
import { useUpload } from '../hooks/useUpload';

interface FileStatus {
  file: File;
  status: 'queued' | 'uploading' | 'done' | 'error';
  error?: string;
}

export function UploadForm({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [queue, setQueue] = useState<FileStatus[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { uploadFile } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | File[]) => {
    const pdfs = Array.from(files).filter(f => f.type === 'application/pdf');
    if (pdfs.length === 0) return;
    setQueue(prev => [
      ...prev,
      ...pdfs.map(f => ({ file: f, status: 'queued' as const }))
    ]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
  };

  const updateStatus = (index: number, update: Partial<FileStatus>) => {
    setQueue(prev => prev.map((item, i) => i === index ? { ...item, ...update } : item));
  };

  const handleUploadAll = async () => {
    setIsRunning(true);
    const pending = queue.map((item, i) => ({ item, i })).filter(({ item }) => item.status === 'queued');

    for (const { item, i } of pending) {
      updateStatus(i, { status: 'uploading' });
      try {
        await uploadFile(item.file);
        updateStatus(i, { status: 'done' });
      } catch (err: any) {
        updateStatus(i, { status: 'error', error: err.message || 'Upload failed' });
      }
    }

    setIsRunning(false);
    onUploadComplete?.();
  };

  const clearDone = () => setQueue(prev => prev.filter(f => f.status !== 'done'));
  const queued = queue.filter(f => f.status === 'queued').length;
  const done = queue.filter(f => f.status === 'done').length;
  const errored = queue.filter(f => f.status === 'error').length;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition"
      >
        <svg className="w-12 h-12 text-gray-400 mb-3 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-gray-500 font-medium mb-3">Drag & drop PDFs here, or choose an option below</p>

        <div className="flex justify-center gap-3">
          {/* Select individual files */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            📄 Select Files
          </button>
          {/* Select entire folder */}
          <button
            onClick={() => folderInputRef.current?.click()}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            📁 Select Folder
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={folderInputRef}
          type="file"
          accept="application/pdf"
          multiple
          // @ts-ignore – webkitdirectory is not in React types but works in all browsers
          webkitdirectory=""
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Summary bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm">
            <span className="text-gray-600">
              {queue.length} file{queue.length !== 1 ? 's' : ''} —{' '}
              <span className="text-green-600">{done} done</span>
              {errored > 0 && <span className="text-red-500 ml-1">{errored} failed</span>}
            </span>
            <div className="flex gap-2">
              {done > 0 && (
                <button onClick={clearDone} className="text-gray-400 hover:text-gray-600 text-xs">
                  Clear done
                </button>
              )}
            </div>
          </div>

          {/* File list */}
          <ul className="max-h-52 overflow-y-auto divide-y divide-gray-100">
            {queue.map((item, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="truncate text-gray-700 max-w-xs" title={item.file.name}>
                  {item.file.name}
                </span>
                <span className="ml-4 shrink-0">
                  {item.status === 'queued'   && <span className="text-gray-400">Queued</span>}
                  {item.status === 'uploading' && <span className="text-blue-500 animate-pulse">Uploading…</span>}
                  {item.status === 'done'      && <span className="text-green-500">✓ Done</span>}
                  {item.status === 'error'     && <span className="text-red-500" title={item.error}>✗ Failed</span>}
                </span>
              </li>
            ))}
          </ul>

          {/* Upload button */}
          {queued > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <button
                onClick={handleUploadAll}
                disabled={isRunning}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium text-sm"
              >
                {isRunning ? 'Uploading…' : `Upload ${queued} file${queued !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
