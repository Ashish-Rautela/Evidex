import type { ParentClause, ChildChunk } from '../types/chunk.types.js';
import type { LegalNode } from './legal-parser.js';
import { generateId } from '../utils/id.js';
import { countTokens } from '../utils/token-counter.js';

// Placeholder — overwritten by embedder.ts after embedding with the actual model ID.
const EMBEDDING_MODEL_PLACEHOLDER = 'pending';

// Smaller chunks (150 words) produce more focused embeddings for legal clauses.
// Overlap of 30 words preserves cross-boundary context without excessive duplication.
const CHUNK_SIZE = 150;
const CHUNK_OVERLAP = 30;

// Snap a word slice to the nearest sentence boundary to avoid mid-sentence splits.
function snapToSentenceBoundary(words: string[], sliceEnd: number): number {
    const sentenceEnd = /[.!?](?:["'])?$/;
    // Search backwards up to 20 words for a sentence-ending word
    for (let i = sliceEnd - 1; i >= Math.max(0, sliceEnd - 20); i--) {
        if (sentenceEnd.test(words[i])) {
            return i + 1;
        }
    }
    return sliceEnd; // No boundary found; use original slice end
}

export interface ChunkResult {
  parentClauses: ParentClause[];
  childChunks: ChildChunk[];
}

export function generateChunks(nodes: LegalNode[], documentId: string, tenantId: string): ChunkResult {
  const result: ChunkResult = {
    parentClauses: [],
    childChunks: []
  };

  const getLeafNodes = (node: LegalNode): LegalNode[] => {
    if (!node.children || node.children.length === 0) {
      return [node];
    }
    const leaves: LegalNode[] = [];
    if (node.fullText) {
       leaves.push(node);
    }
    for (const child of node.children) {
      leaves.push(...getLeafNodes(child));
    }
    return leaves;
  };

  const leafNodes = nodes.flatMap(getLeafNodes);

  for (const node of leafNodes) {
    const clauseId = generateId();
    const tokenCount = countTokens(node.fullText);

    result.parentClauses.push({
      clauseId,
      documentId,
      tenantId,
      clauseIdentifier: `${node.type} ${node.identifier}`,
      title: node.title,
      fullText: node.fullText,
      hierarchyPath: node.identifier,
      startPage: node.startPage,
      endPage: node.endPage,
      tokenCount
    });

    const words = node.fullText.split(/\s+/);
    if (words.length <= CHUNK_SIZE) {
      result.childChunks.push({
        chunkId: generateId(),
        clauseId,
        documentId,
        tenantId,
        chunkIndex: 0,
        chunkText: node.fullText,
        tokenCount: countTokens(node.fullText),
        pageNumber: node.startPage,
        coordinates: { x1: 0, y1: 0, x2: 1, y2: 1 },
        embedding: [],
        embeddingModel: EMBEDDING_MODEL_PLACEHOLDER
      });
      continue;
    }

    let chunkIndex = 0;
    for (let i = 0; i < words.length; i += (CHUNK_SIZE - CHUNK_OVERLAP)) {
      const rawEnd = Math.min(i + CHUNK_SIZE, words.length);
      const snappedEnd = snapToSentenceBoundary(words, rawEnd);
      const chunkWords = words.slice(i, snappedEnd);
      const chunkText = chunkWords.join(' ');
      
      let pageNumber = node.startPage;
      let minX = 1, minY = 1, maxX = 0, maxY = 0;
      let foundBlock = false;

      // Match blocks whose text actually overlaps with this chunk
      const sample = chunkText.slice(0, 40).trim();
      const matchingBlocks = node.blocks.filter(b => {
        if (!b.text) return false;
        const trimmed = b.text.trim();
        return (trimmed.length > 3 && chunkText.includes(trimmed)) || (sample.length > 3 && trimmed.includes(sample));
      });

      if (matchingBlocks.length > 0) {
        pageNumber = matchingBlocks[0].pageNumber;
        for (const block of matchingBlocks) {
          if (block.pageNumber === pageNumber && block.geometry) {
            foundBlock = true;
            minX = Math.min(minX, block.geometry.left);
            minY = Math.min(minY, block.geometry.top);
            maxX = Math.max(maxX, block.geometry.left + block.geometry.width);
            maxY = Math.max(maxY, block.geometry.top + block.geometry.height);
          }
        }
      }

      result.childChunks.push({
        chunkId: generateId(),
        clauseId,
        documentId,
        tenantId,
        chunkIndex,
        chunkText,
        tokenCount: countTokens(chunkText),
        pageNumber,
        coordinates: foundBlock ? { x1: minX, y1: minY, x2: maxX, y2: maxY } : { x1: 0, y1: 0, x2: 1, y2: 1 },
        embedding: [],
        embeddingModel: EMBEDDING_MODEL_PLACEHOLDER
      });
      chunkIndex++;
    }
  }

  return result;
}
