import type { PageContent } from '../types/textract.types.js';

export function parseTextractBlocks(rawBlocks: any[]): PageContent[] {
  const pagesMap = new Map<number, any[]>();
  
  for (const block of rawBlocks) {
    if (!block.Page) continue;
    if (block.BlockType !== 'LINE') continue;
    
    if (!pagesMap.has(block.Page)) {
      pagesMap.set(block.Page, []);
    }
    pagesMap.get(block.Page)!.push(block);
  }
  
  const pages: PageContent[] = [];
  
  for (const [pageNumber, rawPageBlocks] of pagesMap.entries()) {
    const blocks = rawPageBlocks.map(block => ({
      text: block.Text || '',
      geometry: {
        top: block.Geometry?.BoundingBox?.Top || 0,
        left: block.Geometry?.BoundingBox?.Left || 0,
        width: block.Geometry?.BoundingBox?.Width || 0,
        height: block.Geometry?.BoundingBox?.Height || 0
      },
      blockType: block.BlockType,
      pageNumber: block.Page
    }));
    
    const fullText = blocks.map(b => b.text).join('\n');
    
    pages.push({
      pageNumber,
      fullText,
      blocks
    });
  }
  
  return pages.sort((a, b) => a.pageNumber - b.pageNumber);
}
