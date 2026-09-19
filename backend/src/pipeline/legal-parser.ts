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
  SUBSECTION: /^(\d+\.\d+\.\d+)\s+(.+)/,
  SECTION:    /^(\d+\.\d+)\s+(.+)/,
  ARTICLE:    /^(?:ARTICLE|Article)\s+(\d+|[IVXLCDM]+)[\s.:—-]+(.+)/,
  SCHEDULE:   /^(?:Schedule|Exhibit|Annex|Appendix)\s+([A-Z0-9]+)[\s.:—-]*(.*)/,
};

export function parseLegalStructure(pages: PageContent[]): LegalNode[] {
  const nodes: LegalNode[] = [];
  let currentNode: LegalNode | null = null;
  let hasMatches = false;

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
          hasMatches = true;
          currentNode = {
            type: type as LegalNode['type'],
            identifier: match[1],
            title: match[2]?.trim() || '',
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
        if (currentNode) {
          currentNode.fullText += '\n' + text;
          currentNode.endPage = Math.max(currentNode.endPage, page.pageNumber);
          currentNode.blocks.push(line);
        }
      }
    }
  }

  finalizeNode();

  if (!hasMatches && pages.length > 0) {
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
    }
  }

  return rootNodes;
}
