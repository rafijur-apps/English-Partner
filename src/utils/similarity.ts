// Fuzzy string matching algorithm with South Asian / Bangladeshi English accent tolerance

/**
 * Clean and normalize a string by removing punctuation, extra spaces, and lowercasing
 */
export function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .replace(/[’']/g, '') // remove apostrophes for contractions (I'm -> im, don't -> dont)
    .replace(/[^a-z0-9\s]/g, ' ') // replace other punctuation with space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Phonetically map common South Asian / Bengali English phonetic substitutions
 * e.g., 'w'/'v', 'th'/'t', 'ph'/'f', etc.
 */
function phoneticRelax(str: string): string {
  return normalizeText(str)
    .replace(/th/g, 't')
    .replace(/v/g, 'b')
    .replace(/w/g, 'v')
    .replace(/ph/g, 'f')
    .replace(/z/g, 'j');
}

/**
 * Compute Levenshtein distance between two strings
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j], // deletion
          dp[i][j - 1], // insertion
          dp[i - 1][j - 1] // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Compute similarity ratio between 0.0 and 1.0 based on Levenshtein distance
 */
export function levenshteinSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1, s2);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Compute word-level token set overlap ratio (Jaccard similarity on tokens)
 */
export function tokenOverlapRatio(s1: string, s2: string): number {
  const words1 = new Set(s1.split(' ').filter(Boolean));
  const words2 = new Set(s2.split(' ').filter(Boolean));

  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  words1.forEach(w => {
    if (words2.has(w)) intersection++;
  });

  const union = new Set([...words1, ...words2]).size;
  return union > 0 ? intersection / union : 0;
}

export interface MatchResult {
  similarity: number;
  isMatch: boolean;
  cleanExpected: string;
  cleanSpoken: string;
}

/**
 * Comprehensive fuzzy match evaluator
 * Threshold defaults to 0.65 as specified
 */
export function evaluateSpeechMatch(
  spoken: string,
  expected: string,
  threshold: number = 0.65
): MatchResult {
  const cleanSpoken = normalizeText(spoken);
  const cleanExpected = normalizeText(expected);

  // Exact clean match
  if (cleanSpoken === cleanExpected && cleanSpoken.length > 0) {
    return {
      similarity: 1.0,
      isMatch: true,
      cleanExpected,
      cleanSpoken
    };
  }

  if (!cleanSpoken || !cleanExpected) {
    return {
      similarity: 0,
      isMatch: false,
      cleanExpected,
      cleanSpoken
    };
  }

  // Check direct Levenshtein similarity
  const directSim = levenshteinSimilarity(cleanSpoken, cleanExpected);

  // Check token overlap
  const tokenSim = tokenOverlapRatio(cleanSpoken, cleanExpected);

  // Check phonetic relaxed similarity for South Asian accents
  const phoneticSpoken = phoneticRelax(cleanSpoken);
  const phoneticExpected = phoneticRelax(cleanExpected);
  const phoneticSim = levenshteinSimilarity(phoneticSpoken, phoneticExpected);

  // Combined best metric
  const bestScore = Math.max(
    directSim,
    phoneticSim * 0.95, // small dampener for phonetic substitution
    tokenSim * 0.9
  );

  const roundedScore = Math.round(bestScore * 100) / 100;
  const isMatch = roundedScore >= threshold;

  return {
    similarity: roundedScore,
    isMatch,
    cleanExpected,
    cleanSpoken
  };
}
