import { describe, it, expect } from 'vitest';
import { filterByConfidence } from '../../src/services/search.service.js';
import { computeFallbackScore } from '../../src/services/bedrock.service.js';

// Test the RRF formula directly (pure function, no DB dependency)
function calculateRRF(denseRank: number | null, lexicalRank: number | null, k = 60): number {
  const denseScore = denseRank != null ? 1.0 / (k + denseRank) : 0;
  const lexicalScore = lexicalRank != null ? 1.0 / (k + lexicalRank) : 0;
  return denseScore + lexicalScore;
}

describe('RRF Score Calculation', () => {
  it('should compute correct RRF score for rank 1 in both', () => {
    const score = calculateRRF(1, 1);
    expect(score).toBeCloseTo(2 / 61, 6);
  });

  it('should handle dense-only results', () => {
    const score = calculateRRF(1, null);
    expect(score).toBeCloseTo(1 / 61, 6);
  });

  it('should handle lexical-only results', () => {
    const score = calculateRRF(null, 5);
    expect(score).toBeCloseTo(1 / 65, 6);
  });

  it('should rank higher for lower rank numbers', () => {
    const score1 = calculateRRF(1, 1);
    const score10 = calculateRRF(10, 10);
    expect(score1).toBeGreaterThan(score10);
  });

  it('should return 0 for no ranks', () => {
    expect(calculateRRF(null, null)).toBe(0);
  });
});

describe('Confidence Filtering', () => {
  it('should return empty array if no results meet minScore threshold (never return fallback)', () => {
    const lowConfidenceResults = [
      { relevanceScore: 0.35, id: '1' },
      { relevanceScore: 0.42, id: '2' },
      { relevanceScore: 0.18, id: '3' },
    ];
    const filtered = filterByConfidence(lowConfidenceResults, 0.55);
    expect(filtered).toEqual([]);
  });

  it('should keep results above minScore when top score is moderate', () => {
    const results = [
      { relevanceScore: 0.72, id: '1' },
      { relevanceScore: 0.65, id: '2' },
      { relevanceScore: 0.40, id: '3' },
    ];
    const filtered = filterByConfidence(results, 0.55);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(r => r.id)).toEqual(['1', '2']);
  });

  it('should narrow down results to top window when top score has high confidence (>= 0.85)', () => {
    const results = [
      { relevanceScore: 0.95, id: '1' }, // topScore
      { relevanceScore: 0.88, id: '2' }, // within 20% (>= 0.75) -> keep
      { relevanceScore: 0.70, id: '3' }, // below topScore - 0.20 -> drop
      { relevanceScore: 0.60, id: '4' }, // drop
    ];
    const filtered = filterByConfidence(results, 0.55, 0.85, 0.20);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(r => r.id)).toEqual(['1', '2']);
  });
});

describe('Fallback Scoring Calibration', () => {
  it('should give low score (< 0.25) to weak dense matches without lexical match (prevents gibberish matches)', () => {
    // A gibberish query with dense similarity around 0.30 and no keyword match
    const score = computeFallbackScore({
      isLexicalMatch: false,
      denseSimilarity: 0.30,
    });
    expect(score).toBeLessThan(0.25);
  });

  it('should score 0 for very low dense similarity without lexical match', () => {
    const score = computeFallbackScore({
      isLexicalMatch: false,
      denseSimilarity: 0.30,
    });
    expect(score).toBe(0);
  });

  it('should give high score (>= 0.70) when lexical match is present', () => {
    const lexicalOnly = computeFallbackScore({
      isLexicalMatch: true,
      denseSimilarity: 0,
    });
    expect(lexicalOnly).toBe(0.70);

    const lexicalPlusDense = computeFallbackScore({
      isLexicalMatch: true,
      denseSimilarity: 0.72,
    });
    expect(lexicalPlusDense).toBeGreaterThanOrEqual(0.85);
  });

  it('should preserve strong semantic matches without exact keywords', () => {
    const strongSemantic = computeFallbackScore({
      isLexicalMatch: false,
      denseSimilarity: 0.75,
    });
    expect(strongSemantic).toBe(0.75);
  });
});
