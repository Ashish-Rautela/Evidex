import { describe, it, expect } from 'vitest';

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
