import type { PageContent } from '../types/textract.types.js';

export interface LegalNode {
  type: 'ARTICLE' | 'SECTION' | 'SUBSECTION' | 'SCHEDULE' | 'PARAGRAPH';
  identifier: string;
  title: string;
  fullText: string;
  startPage: number;
  endPage: number;
  children: LegalNode[];
  blocks: Array<{ text: string; pageNumber: number; geometry: { top: number; left: number; width: number; height: number } }>;
}

const PATTERNS = {
  SUBSECTION: /^(?:(?:Sub-?section|Clause)\s+)?(\d{1,2}\.\d{1,2}\.\d{1,2})\.?\s+([A-Z].*)/,
  SECTION:    /^(?:(?:Section|SECTION|Sec\.|Clause)\s+(\d+(?:\.\d{1,2})?)|(\d{1,2}\.\d{1,2}))\.?\s+([A-Z].*)/,
  ARTICLE:    /^(?:ARTICLE|Article)\s+(\d+|[IVXLCDM]+)[\s.:—-]+(.+)/,
  SCHEDULE:   /^(?:Schedule|Exhibit|Annex|Appendix)\s+([A-Z0-9]+)[\s.:—-]*(.*)/i,
};

export function parseLegalStructure(pages: PageContent[]): LegalNode[] {
  const nodes: LegalNode[] = [];
  let currentNode: LegalNode | null = null;
  let structuralMatchCount = 0;

  const finalizeNode = () => {
    if (currentNode) {
      currentNode.fullText = currentNode.fullText.trim();
      nodes.push(currentNode);
      currentNode = null;
    }
  };

  for (const page of pages) {
    if (!page.blocks) continue;
    
    for (const line of page.blocks) {
      const text = line.text.trim();
      if (!text) continue;

      let matched = false;

      for (const [type, regex] of Object.entries(PATTERNS)) {
        const match = text.match(regex);
        if (match) {
          finalizeNode();
          structuralMatchCount++;
          const identifier = (type === 'SECTION') ? (match[1] || match[2]) : match[1];
          const title = (type === 'SECTION') ? (match[3]?.trim() || '') : (match[2]?.trim() || '');
          currentNode = {
            type: type as LegalNode['type'],
            identifier: identifier || '1',
            title: title || '',
            fullText: text,
            startPage: page.pageNumber,
            endPage: page.pageNumber,
            children: [],
            blocks: [line]
          };
          matched = true;
          break;
        }
      }

      if (!matched) {
        if (!currentNode) {
          // ponytail: capture preamble/intro text before first section so it is not discarded
          currentNode = {
            type: 'PARAGRAPH',
            identifier: 'Preamble',
            title: 'Preamble',
            fullText: text,
            startPage: page.pageNumber,
            endPage: page.pageNumber,
            children: [],
            blocks: [line]
          };
        } else {
          currentNode.fullText += '\n' + text;
          currentNode.endPage = Math.max(currentNode.endPage, page.pageNumber);
          currentNode.blocks.push(line);
        }
      }
    }
  }

  finalizeNode();

  // If no structural matches, or in large documents where matches are sparse/incidental (e.g. casebooks, court judgments),
  // fall back to page-by-page paragraph nodes for accurate search and page-level retrieval.
  const isStructured = structuralMatchCount >= (pages.length <= 5 ? 1 : 3);

  if (!isStructured && pages.length > 0) {
    return pages.map(page => ({
      type: 'PARAGRAPH',
      identifier: `P${page.pageNumber}`,
      title: `Page ${page.pageNumber}`,
      fullText: page.fullText || '',
      startPage: page.pageNumber,
      endPage: page.pageNumber,
      children: [],
      blocks: page.blocks || []
    }));
  }

  const rootNodes: LegalNode[] = [];
  let currentArticle: LegalNode | null = null;
  let currentSection: LegalNode | null = null;

  for (const node of nodes) {
    if (node.type === 'ARTICLE' || node.type === 'SCHEDULE') {
      rootNodes.push(node);
      currentArticle = node;
      currentSection = null;
    } else if (node.type === 'SECTION') {
      if (currentArticle) {
        currentArticle.children.push(node);
      } else {
        rootNodes.push(node);
      }
      currentSection = node;
    } else if (node.type === 'SUBSECTION') {
      if (currentSection) {
        currentSection.children.push(node);
      } else if (currentArticle) {
        currentArticle.children.push(node);
      } else {
        rootNodes.push(node);
      }
    } else {
      rootNodes.push(node);
    }
  }

  return rootNodes;
}
