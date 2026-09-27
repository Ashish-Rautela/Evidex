import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, FileText, CheckCircle2 } from 'lucide-react';
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
      const t = setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
      return () => clearTimeout(t);
    }
  }, [currentPage, numPages]);

  const startPage = Math.max(1, currentPage - PAGE_WINDOW);
  const endPage = numPages ? Math.min(numPages, currentPage + PAGE_WINDOW) : currentPage + PAGE_WINDOW;
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  const showHighlight = currentPage === pageNumber && isRealHighlight(coordinates);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      <div className="flex-1 flex flex-col bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_#000] overflow-hidden">
        {/* Retro Mac window header & navigation */}
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-100 border-b-2 border-black font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full border border-black bg-white inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full border border-black bg-white inline-block"></span>
            </span>
            <span className="font-bold text-black flex items-center gap-1.5 ml-2">
              <FileText className="w-3.5 h-3.5" />
              viewer.app
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="ink-btn px-2.5 py-1 text-xs font-mono font-bold bg-white text-black rounded disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5 inline mr-1" /> Prev
            </button>
            <span className="font-mono font-bold text-black">
              Page {currentPage}{numPages ? ` / ${numPages}` : ''}
              {currentPage === pageNumber && (
                <span className="ml-2 bg-black text-white px-1.5 py-0.5 rounded text-[10px]">MATCH</span>
              )}
            </span>
            <button
              onClick={() => setCurrentPage(p => numPages ? Math.min(numPages, p + 1) : p + 1)}
              disabled={!!numPages && currentPage >= numPages}
              className="ink-btn px-2.5 py-1 text-xs font-mono font-bold bg-white text-black rounded disabled:opacity-30"
            >
              Next <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
            </button>
          </div>
        </div>

        {/* PDF Document viewport */}
        <div className="flex-1 overflow-auto p-6 flex flex-col items-center bg-neutral-200">
          <Document 
            file={pdfUrl} 
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={<div className="p-10 font-mono text-sm font-bold text-black">Loading Contract PDF…</div>}
            className="flex flex-col gap-6 w-full items-center"
          >
            {pages.map((p) => (
              <div
                key={p}
                ref={p === currentPage ? targetRef : undefined}
                className="relative border-2 border-black shadow-[4px_4px_0px_#000] bg-white"
              >
                <Page 
                  pageNumber={p} 
                  renderTextLayer={false} 
                  renderAnnotationLayer={false} 
                  width={780}
                  className="overflow-hidden"
                />
                {p === pageNumber && showHighlight && (
                  <div
                    className="absolute bg-black/15 border-2 border-black pointer-events-none transition-all duration-300"
                    style={{
                      left: `${coordinates!.x1 * 100}%`,
                      top: `${coordinates!.y1 * 100}%`,
                      width: `${(coordinates!.x2 - coordinates!.x1) * 100}%`,
                      height: `${(coordinates!.y2 - coordinates!.y1) * 100}%`,
                    }}
                  />
                )}
                <div className="absolute bottom-2 right-3 font-mono text-xs font-bold text-black bg-white border border-black px-2 py-0.5 shadow-[1px_1px_0px_#000]">
                  p. {p}
                </div>
              </div>
            ))}
          </Document>
        </div>
      </div>
      
      {(clauseTitle || clauseText) && (
        <div className="w-full lg:w-96 bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_#000] overflow-hidden flex flex-col">
          <div className="px-4 py-2 bg-neutral-100 border-b-2 border-black font-mono text-xs font-bold text-black flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Clause Inspector
          </div>
          <div className="p-5 flex-1 overflow-auto flex flex-col">
            <h3 className="font-bold text-black text-base mb-3 border-b-2 border-black pb-2">{clauseTitle || 'Clause Details'}</h3>
            <div className="font-serif text-sm text-black leading-relaxed whitespace-pre-wrap flex-1">
              {clauseText || 'No clause text provided.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
