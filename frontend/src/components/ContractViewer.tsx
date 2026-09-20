import { useState, useEffect, useRef } from 'react';
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

// ponytail: full-page fallback coordinates (0,0,1,1) are meaningless — skip highlight
function isRealHighlight(c: Props['coordinates']): boolean {
  if (!c) return false;
  return !(c.x1 === 0 && c.y1 === 0 && c.x2 === 1 && c.y2 === 1);
}

// ponytail: render ±2 pages around target instead of all 231 — ceiling is no free-scroll through entire PDF
const PAGE_WINDOW = 2;

export function ContractViewer({ pdfUrl, pageNumber, coordinates, clauseTitle, clauseText }: Props) {
  const [numPages, setNumPages] = useState<number>();
  const [currentPage, setCurrentPage] = useState(pageNumber);
  const targetRef = useRef<HTMLDivElement>(null);

  // Scroll to target page once rendered
  useEffect(() => {
    const el = targetRef.current;
    if (el) {
      // Small delay for react-pdf to finish layout
      const t = setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
      return () => clearTimeout(t);
    }
  }, [currentPage, numPages]);

  const startPage = Math.max(1, currentPage - PAGE_WINDOW);
  const endPage = numPages ? Math.min(numPages, currentPage + PAGE_WINDOW) : currentPage + PAGE_WINDOW;
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  const showHighlight = currentPage === pageNumber && isRealHighlight(coordinates);

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-120px)]">
      <div className="flex-1 flex flex-col bg-gray-200 rounded-xl border border-gray-300 shadow-inner">
        {/* Page navigation */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 rounded-t-xl border-b border-gray-300">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1 text-sm font-medium rounded-lg bg-white border border-gray-200 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <span className="text-sm font-medium text-gray-700">
            Page {currentPage}{numPages ? ` / ${numPages}` : ''}
            {currentPage === pageNumber && <span className="ml-2 text-xs text-blue-600 font-bold">(Match)</span>}
          </span>
          <button
            onClick={() => setCurrentPage(p => numPages ? Math.min(numPages, p + 1) : p + 1)}
            disabled={!!numPages && currentPage >= numPages}
            className="px-3 py-1 text-sm font-medium rounded-lg bg-white border border-gray-200 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>

        <div className="flex-1 overflow-auto p-8 flex flex-col items-center">
          <Document 
            file={pdfUrl} 
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={<div className="p-10 text-gray-500 font-medium">Loading Document...</div>}
            className="flex flex-col gap-6 w-full items-center"
          >
            {pages.map((p) => (
              <div
                key={p}
                ref={p === currentPage ? targetRef : undefined}
                className="relative shadow-lg bg-white"
              >
                <Page 
                  pageNumber={p} 
                  renderTextLayer={false} 
                  renderAnnotationLayer={false} 
                  width={800}
                  className="overflow-hidden"
                />
                {p === pageNumber && showHighlight && (
                  <div
                    className="absolute bg-yellow-400/40 border-2 border-yellow-500 pointer-events-none transition-all duration-500"
                    style={{
                      left: `${coordinates!.x1 * 100}%`,
                      top: `${coordinates!.y1 * 100}%`,
                      width: `${(coordinates!.x2 - coordinates!.x1) * 100}%`,
                      height: `${(coordinates!.y2 - coordinates!.y1) * 100}%`,
                    }}
                  />
                )}
                <div className="absolute bottom-2 right-3 text-xs text-gray-400 bg-white/80 px-2 py-0.5 rounded">
                  {p}
                </div>
              </div>
            ))}
          </Document>
        </div>
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
