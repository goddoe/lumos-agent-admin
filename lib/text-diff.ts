import { diffWords } from 'diff';

export interface DiffSegment {
  type: 'common' | 'added' | 'removed';
  text: string;
}

export function computeTextHighlight(text1: string, text2: string, targetText: string): DiffSegment[] {
  // Use diff library to compute precise differences
  const diff = diffWords(text1, text2);
  
  // Determine which perspective we're showing (text1 or text2)
  const isShowingText1 = targetText === text1;
  const result: DiffSegment[] = [];
  
  for (const part of diff) {
    if (part.added) {
      // Added parts appear only in text2
      if (!isShowingText1) {
        result.push({ type: 'added', text: part.value });
      }
      // If showing text1, we skip added parts (they don't exist in text1)
    } else if (part.removed) {
      // Removed parts appear only in text1
      if (isShowingText1) {
        result.push({ type: 'removed', text: part.value });
      }
      // If showing text2, we skip removed parts (they don't exist in text2)
    } else {
      // Common parts appear in both texts
      result.push({ type: 'common', text: part.value });
    }
  }
  
  return result;
}

// Alternative function for side-by-side comparison showing unique parts
export function computeTextHighlightWithUnique(text1: string, text2: string, targetText: string): DiffSegment[] {
  const diff = diffWords(text1, text2);
  const isShowingText1 = targetText === text1;
  const result: DiffSegment[] = [];
  
  for (const part of diff) {
    if (part.added) {
      // Added parts (unique to text2)
      if (!isShowingText1) {
        result.push({ type: 'added', text: part.value });
      }
    } else if (part.removed) {
      // Removed parts (unique to text1)
      if (isShowingText1) {
        result.push({ type: 'added', text: part.value }); // Show as unique to text1
      }
    } else {
      // Common parts
      result.push({ type: 'common', text: part.value });
    }
  }
  
  return result;
}

// Merge consecutive segments of the same type for cleaner display
export function mergeConsecutiveSegments(segments: DiffSegment[]): DiffSegment[] {
  if (segments.length === 0) return [];
  
  const merged: DiffSegment[] = [];
  let current = { ...segments[0] };
  
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    
    if (segment.type === current.type) {
      // Merge consecutive segments of the same type
      current.text += segment.text;
    } else {
      // Different type, push current and start new one
      merged.push(current);
      current = { ...segment };
    }
  }
  
  // Don't forget the last segment
  merged.push(current);
  
  return merged;
}