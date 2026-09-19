import { describe, it, expect } from 'vitest';
import { generateChunks } from '../../src/pipeline/chunker.js';
import type { LegalNode } from '../../src/pipeline/legal-parser.js';

describe('generateChunks', () => {
  it('should create parent clause and child chunks for a leaf node', () => {
    const nodes: LegalNode[] = [{
      type: 'SECTION',
      identifier: '14.2',
      title: 'Termination for Non-Payment',
      fullText: Array(300).fill('word').join(' '),
      startPage: 47,
      endPage: 47,
      children: [],
      blocks: [{ text: Array(300).fill('word').join(' '), pageNumber: 47, geometry: { top: 0.4, left: 0.1, width: 0.8, height: 0.2 } }],
    }];
    const result = generateChunks(nodes, 'DOC1', 'TENANT1');
    expect(result.parentClauses).toHaveLength(1);
    expect(result.parentClauses[0].clauseIdentifier).toContain('14.2');
    expect(result.childChunks.length).toBeGreaterThan(1);
    expect(result.childChunks.every(c => c.clauseId === result.parentClauses[0].clauseId)).toBe(true);
  });

  it('should create a single child chunk for short text', () => {
    const nodes: LegalNode[] = [{
      type: 'SECTION',
      identifier: '1.1',
      title: 'Definitions',
      fullText: 'Agreement means this document.',
      startPage: 1,
      endPage: 1,
      children: [],
      blocks: [{ text: 'Agreement means this document.', pageNumber: 1, geometry: { top: 0.1, left: 0.1, width: 0.5, height: 0.03 } }],
    }];
    const result = generateChunks(nodes, 'DOC1', 'TENANT1');
    expect(result.childChunks).toHaveLength(1);
    expect(result.childChunks[0].chunkText).toBe('Agreement means this document.');
  });

  it('should have valid bounding box coordinates', () => {
    const nodes: LegalNode[] = [{
      type: 'PARAGRAPH',
      identifier: 'p1',
      title: '',
      fullText: 'Some text content here',
      startPage: 1,
      endPage: 1,
      children: [],
      blocks: [{ text: 'Some text content here', pageNumber: 1, geometry: { top: 0.3, left: 0.1, width: 0.6, height: 0.05 } }],
    }];
    const result = generateChunks(nodes, 'DOC1', 'TENANT1');
    const coords = result.childChunks[0].coordinates;
    expect(coords.x1).toBeGreaterThanOrEqual(0);
    expect(coords.y1).toBeGreaterThanOrEqual(0);
    expect(coords.x2).toBeLessThanOrEqual(1);
    expect(coords.y2).toBeLessThanOrEqual(1);
    expect(coords.x2).toBeGreaterThan(coords.x1);
    expect(coords.y2).toBeGreaterThan(coords.y1);
  });
});
