/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Calculate distances
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity ratio between two strings (0-1, where 1 is identical)
 */
export function calculateSimilarityRatio(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  return maxLength === 0 ? 1 : 1 - (distance / maxLength);
}

/**
 * Determine if two answers are similar enough to be considered automated
 * Now uses only Levenshtein distance for simplicity
 */
export function isAutomatedAnswer(aiContent: string, humanContent: string, threshold: number = 0.7): boolean {
  const similarity = calculateSimilarityRatio(aiContent, humanContent);
  return similarity >= threshold;
}

/**
 * Get similarity score between two texts using only Levenshtein distance
 */
export function getSimilarityScore(aiContent: string, humanContent: string): number {
  return calculateSimilarityRatio(aiContent, humanContent);
}