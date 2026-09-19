import { describe, it, expect } from 'vitest';
import { parseLegalStructure } from '../../src/pipeline/legal-parser.js';
import type { PageContent } from '../../src/types/textract.types.js';

describe('parseLegalStructure', () => {
  it('should detect Article and Section boundaries', () => {
    const pages: PageContent[] = [
      {
        pageNumber: 1,
        fullText: 'ARTICLE 1 - Definitions\n1.1 Agreement means the contract\n1.2 Parties means the signatories',
        blocks: [
          { text: 'ARTICLE 1 - Definitions', blockType: 'LINE', pageNumber: 1, geometry: { top: 0.1, left: 0.1, width: 0.5, height: 0.03 } },
          { text: '1.1 Agreement means the contract', blockType: 'LINE', pageNumber: 1, geometry: { top: 0.15, left: 0.1, width: 0.7, height: 0.03 } },
          { text: '1.2 Parties means the signatories', blockType: 'LINE', pageNumber: 1, geometry: { top: 0.2, left: 0.1, width: 0.7, height: 0.03 } },
        ],
      },
    ];
    const nodes = parseLegalStructure(pages);
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes[0].type).toBe('ARTICLE');
    expect(nodes[0].identifier).toBe('1');
    expect(nodes[0].title).toContain('Definitions');
  });

  it('should fall back to PARAGRAPH nodes for unstructured text', () => {
    const pages: PageContent[] = [
      {
        pageNumber: 1,
        fullText: 'This is a plain text document without legal structure.',
        blocks: [
          { text: 'This is a plain text document without legal structure.', blockType: 'LINE', pageNumber: 1, geometry: { top: 0.1, left: 0.1, width: 0.8, height: 0.03 } },
        ],
      },
    ];
    const nodes = parseLegalStructure(pages);
    expect(nodes.length).toBe(1);
    expect(nodes[0].type).toBe('PARAGRAPH');
  });

  it('should handle multiple articles across pages', () => {
    const pages: PageContent[] = [
      {
        pageNumber: 1,
        fullText: 'Article 1 - Scope\nThe scope of this agreement',
        blocks: [
          { text: 'Article 1 - Scope', blockType: 'LINE', pageNumber: 1, geometry: { top: 0.1, left: 0.1, width: 0.5, height: 0.03 } },
          { text: 'The scope of this agreement', blockType: 'LINE', pageNumber: 1, geometry: { top: 0.15, left: 0.1, width: 0.7, height: 0.03 } },
        ],
      },
      {
        pageNumber: 2,
        fullText: 'Article 2 - Term\nThe term shall be 12 months',
        blocks: [
          { text: 'Article 2 - Term', blockType: 'LINE', pageNumber: 2, geometry: { top: 0.1, left: 0.1, width: 0.5, height: 0.03 } },
          { text: 'The term shall be 12 months', blockType: 'LINE', pageNumber: 2, geometry: { top: 0.15, left: 0.1, width: 0.7, height: 0.03 } },
        ],
      },
    ];
    const nodes = parseLegalStructure(pages);
    expect(nodes.length).toBe(2);
    expect(nodes[0].identifier).toBe('1');
    expect(nodes[1].identifier).toBe('2');
  });
});
