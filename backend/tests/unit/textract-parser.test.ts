import { describe, it, expect } from 'vitest';
import { parseTextractBlocks } from '../../src/pipeline/textract-parser.js';

describe('parseTextractBlocks', () => {
  it('should group blocks by page and extract LINE text', () => {
    const rawBlocks = [
      { BlockType: 'PAGE', Page: 1, Geometry: { BoundingBox: { Top: 0, Left: 0, Width: 1, Height: 1 } } },
      { BlockType: 'LINE', Text: 'Hello World', Page: 1, Geometry: { BoundingBox: { Top: 0.1, Left: 0.1, Width: 0.5, Height: 0.03 } } },
      { BlockType: 'LINE', Text: 'Second line', Page: 1, Geometry: { BoundingBox: { Top: 0.15, Left: 0.1, Width: 0.4, Height: 0.03 } } },
      { BlockType: 'PAGE', Page: 2, Geometry: { BoundingBox: { Top: 0, Left: 0, Width: 1, Height: 1 } } },
      { BlockType: 'LINE', Text: 'Page two content', Page: 2, Geometry: { BoundingBox: { Top: 0.1, Left: 0.1, Width: 0.6, Height: 0.03 } } },
    ];
    const pages = parseTextractBlocks(rawBlocks);
    expect(pages).toHaveLength(2);
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[0].blocks).toHaveLength(2);
    expect(pages[0].fullText).toContain('Hello World');
    expect(pages[1].pageNumber).toBe(2);
    expect(pages[1].blocks).toHaveLength(1);
  });

  it('should skip non-LINE blocks', () => {
    const rawBlocks = [
      { BlockType: 'PAGE', Page: 1, Geometry: { BoundingBox: { Top: 0, Left: 0, Width: 1, Height: 1 } } },
      { BlockType: 'WORD', Text: 'Hello', Page: 1, Geometry: { BoundingBox: { Top: 0.1, Left: 0.1, Width: 0.2, Height: 0.03 } } },
      { BlockType: 'LINE', Text: 'Hello World', Page: 1, Geometry: { BoundingBox: { Top: 0.1, Left: 0.1, Width: 0.5, Height: 0.03 } } },
    ];
    const pages = parseTextractBlocks(rawBlocks);
    expect(pages[0].blocks).toHaveLength(1);
  });

  it('should return empty array for no blocks', () => {
    expect(parseTextractBlocks([])).toHaveLength(0);
  });
});
