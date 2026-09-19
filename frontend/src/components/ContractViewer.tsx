import { useState, useEffect } from 'react';
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
  const [numPages, setNumPages] = useState<number>();

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-120px)]">
      <div className="flex-1 bg-gray-200 p-8 rounded-xl border border-gray-300 overflow-auto flex flex-col items-center shadow-inner relative">
        <Document 
          file={pdfUrl} 
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<div className="p-10 text-gray-500 font-medium">Loading Document...</div>}
          className="flex flex-col gap-6 w-full items-center"
        >
          {Array.from({ length: numPages || 0 }, (_, i) => i + 1).map((p) => (
            <div key={p} id={`pdf-page-${p}`} className="relative shadow-lg bg-white">
              <Page 
                pageNumber={p} 
                renderTextLayer={false} 
                renderAnnotationLayer={false} 
                width={800}
                className="overflow-hidden"
                onLoadSuccess={
                  p === pageNumber 
                    ? () => {
                        setTimeout(() => {
                          const pageElement = document.getElementById(`pdf-page-${p}`);
                          if (pageElement) {
                            pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 200); // Wait for DOM layout
                      }
                    : undefined
                }
              />
              {p === pageNumber && coordinates && (
                <div
                  className="absolute bg-yellow-400/40 border-2 border-yellow-500 pointer-events-none transition-all duration-500"
                  style={{
                    left: `${coordinates.x1 * 100}%`,
                    top: `${coordinates.y1 * 100}%`,
                    width: `${(coordinates.x2 - coordinates.x1) * 100}%`,
                    height: `${(coordinates.y2 - coordinates.y1) * 100}%`,
                  }}
                />
              )}
            </div>
          ))}
        </Document>
      </div>
      
      {(clauseTitle || clauseText) && (
        <div className="w-full md:w-96 bg-white p-6 border border-gray-200 rounded-xl shadow-md overflow-auto flex flex-col">
          <h3 className="font-bold text-gray-900 text-lg mb-4 border-b border-gray-100 pb-3">{clauseTitle || 'Clause Details'}</h3>
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap flex-1">
            {clauseText || 'No text provided.'}
          </div>
        </div>
      )}
    </div>
  );
}
