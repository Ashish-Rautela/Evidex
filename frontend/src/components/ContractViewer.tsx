import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  pdfUrl: string;
  pageNumber: number;
  coordinates?: { x1: number; y1: number; x2: number; y2: number };
  clauseTitle?: string;
  clauseText?: string;
}

export function ContractViewer({ pdfUrl, pageNumber, coordinates, clauseTitle, clauseText }: Props) {
  const [, setNumPages] = useState<number>();

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-120px)]">
      <div className="flex-1 bg-gray-100 p-4 rounded border border-gray-200 overflow-auto flex justify-center relative shadow-inner">
        <Document 
          file={pdfUrl} 
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<div className="p-10 text-gray-500">Loading PDF...</div>}
        >
          <div className="relative shadow-md bg-white">
            <Page 
              pageNumber={pageNumber} 
              renderTextLayer={false} 
              renderAnnotationLayer={false} 
              width={800}
            />
            {coordinates && (
              <div
                className="absolute bg-yellow-400/30 border-2 border-yellow-500 pointer-events-none"
                style={{
                  left: `${coordinates.x1 * 100}%`,
                  top: `${coordinates.y1 * 100}%`,
                  width: `${(coordinates.x2 - coordinates.x1) * 100}%`,
                  height: `${(coordinates.y2 - coordinates.y1) * 100}%`,
                }}
              />
            )}
          </div>
        </Document>
      </div>
      
      {(clauseTitle || clauseText) && (
        <div className="w-full md:w-80 bg-white p-5 border border-gray-200 rounded shadow-sm overflow-auto">
          <h3 className="font-bold text-gray-900 mb-3 border-b pb-2">{clauseTitle || 'Clause Details'}</h3>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {clauseText || 'No text provided.'}
          </div>
        </div>
      )}
    </div>
  );
}
