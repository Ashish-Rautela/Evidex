import { useState, useRef } from 'react';
import { useUpload } from '../hooks/useUpload';
import { 
  FileText, 
  FolderUp, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X,
  FileCheck2
} from 'lucide-react';

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
  const removeFile = (index: number) => setQueue(prev => prev.filter((_, i) => i !== index));

  const queued = queue.filter(f => f.status === 'queued').length;
  const done = queue.filter(f => f.status === 'done').length;
  const errored = queue.filter(f => f.status === 'error').length;

  return (
    <div className="space-y-4">
      {/* Drop zone in ink style */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-black rounded-lg p-8 text-center bg-white shadow-[3px_3px_0px_#000] transition-colors hover:bg-neutral-50"
      >
        <div className="w-12 h-12 mx-auto mb-3 border-2 border-black rounded-full flex items-center justify-center bg-neutral-100 shadow-[2px_2px_0px_#000]">
          <UploadCloud className="w-6 h-6 text-black" strokeWidth={2} />
        </div>
        <h3 className="font-mono font-bold text-base text-black tracking-tight mb-1">
          Drop PDF Contracts Here
        </h3>
        <p className="text-neutral-600 text-sm font-medium mb-5">
          Ingest legal agreements into your semantic intelligence index
        </p>

        <div className="flex justify-center gap-3 flex-wrap">
          {/* Select individual files - NO EMOJIS, Lucide icons */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="ink-btn bg-white hover:bg-neutral-100 text-black px-4 py-2 rounded text-sm font-mono font-bold flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-black" strokeWidth={2} />
            Select Files
          </button>

          {/* Select entire folder - NO EMOJIS, Lucide icons */}
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="ink-btn bg-white hover:bg-neutral-100 text-black px-4 py-2 rounded text-sm font-mono font-bold flex items-center gap-2"
          >
            <FolderUp className="w-4 h-4 text-black" strokeWidth={2} />
            Select Folder
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
          // @ts-ignore – webkitdirectory is standard for folder picking
          webkitdirectory=""
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Queue in retro ink window format */}
      {queue.length > 0 && (
        <div className="border-2 border-black rounded-lg overflow-hidden bg-white shadow-[3px_3px_0px_#000]">
          {/* Summary bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-100 border-b-2 border-black font-mono text-xs">
            <span className="font-bold text-black flex items-center gap-2">
              <FileCheck2 className="w-4 h-4" />
              {queue.length} file{queue.length !== 1 ? 's' : ''} queued
              {done > 0 && <span className="bg-black text-white px-1.5 py-0.5 rounded font-mono text-[10px]">{done} ready</span>}
              {errored > 0 && <span className="border border-black px-1.5 py-0.5 rounded font-mono text-[10px] text-red-600">{errored} failed</span>}
            </span>
            <div className="flex gap-2">
              {done > 0 && (
                <button 
                  onClick={clearDone} 
                  className="font-bold text-black hover:underline cursor-pointer"
                >
                  [ Clear done ]
                </button>
              )}
            </div>
          </div>

          {/* File list */}
          <ul className="max-h-56 overflow-y-auto divide-y divide-black/10 font-mono text-xs">
            {queue.map((item, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-neutral-50">
                <span className="truncate text-black font-medium max-w-sm flex items-center gap-2" title={item.file.name}>
                  <FileText className="w-3.5 h-3.5 shrink-0 text-black" />
                  {item.file.name}
                </span>
                <div className="ml-4 shrink-0 flex items-center gap-3">
                  {item.status === 'queued' && (
                    <span className="text-neutral-500 font-mono">Queued</span>
                  )}
                  {item.status === 'uploading' && (
                    <span className="text-black font-bold flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Ingesting…
                    </span>
                  )}
                  {item.status === 'done' && (
                    <span className="text-black font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Done
                    </span>
                  )}
                  {item.status === 'error' && (
                    <span className="text-red-600 font-bold flex items-center gap-1" title={item.error}>
                      <AlertCircle className="w-3.5 h-3.5" /> Failed
                    </span>
                  )}
                  {item.status === 'queued' && !isRunning && (
                    <button
                      onClick={() => removeFile(i)}
                      className="text-neutral-400 hover:text-black transition-colors"
                      title="Remove from queue"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Upload button */}
          {queued > 0 && (
            <div className="px-4 py-3 bg-neutral-100 border-t-2 border-black">
              <button
                onClick={handleUploadAll}
                disabled={isRunning}
                className="ink-btn w-full py-2.5 bg-black text-white hover:bg-neutral-900 disabled:opacity-50 font-mono font-bold text-sm tracking-wide"
              >
                {isRunning ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Ingesting {queued} Contract{queued !== 1 ? 's' : ''}…
                  </span>
                ) : (
                  `Execute Ingestion (${queued} Document${queued !== 1 ? 's' : ''}) →`
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
