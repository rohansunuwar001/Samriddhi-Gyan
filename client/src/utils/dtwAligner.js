/**
 * Dynamic Time Warping (DTW) Subtitle Alignment Engine
 *
 * Aligns drifted subtitle cues with a highly accurate sequence of transcribed audio words.
 *
 * cost(i, j) = Levenshtein character distance / character length
 * Warping cumulative distance: D(i,j) = cost(i,j) + min(D(i-1, j), D(i, j-1), D(i-1, j-1))
 */

// Helper: Levenshtein distance between two strings
function levenshtein(s1 = "", s2 = "") {
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();
  if (str1 === str2) return 0;
  if (str1.length === 0) return str2.length;
  if (str2.length === 0) return str1.length;

  const matrix = [];
  for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
  for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2[i - 1] === str1[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1  // deletion
          )
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

/**
 * Align cues using Dynamic Time Warping
 * @param {Array} cues - Original drifted cues: [{ id, text, start, end }]
 * @param {Array} words - Accurate transcribed words: [{ word, start, end }]
 * @returns {Array} - Aligned cues with updated start and end times
 */
export function alignSubtitlesDTW(cues = [], words = []) {
  if (cues.length === 0 || words.length === 0) return cues;

  const N = cues.length;
  const M = words.length;

  // 1. Initialize DTW Cost Matrix
  const dtw = Array.from({ length: N }, () => Array(M).fill(0));
  const cost = Array.from({ length: N }, () => Array(M).fill(0));

  // Compute local cost matrix (character mismatch ratio)
  for (let i = 0; i < N; i++) {
    const cueText = cues[i].text;
    for (let j = 0; j < M; j++) {
      const wordText = words[j].word;
      const dist = levenshtein(cueText, wordText);
      const maxLen = Math.max(cueText.length, wordText.length) || 1;
      cost[i][j] = dist / maxLen; // Normalized cost [0, 1]
    }
  }

  // Populate DP cumulative distance matrix
  dtw[0][0] = cost[0][0];
  for (let j = 1; j < M; j++) dtw[0][j] = dtw[0][j - 1] + cost[0][j];
  for (let i = 1; i < N; i++) dtw[i][0] = dtw[i - 1][0] + cost[i][0];

  for (let i = 1; i < N; i++) {
    for (let j = 1; j < M; j++) {
      dtw[i][j] = cost[i][j] + Math.min(
        dtw[i - 1][j],     // deletion
        Math.min(
          dtw[i][j - 1],   // insertion
          dtw[i - 1][j - 1] // match/substitution
        )
      );
    }
  }

  // 2. Backtrack to find optimal warping path
  let i = N - 1;
  let j = M - 1;
  const path = [[i, j]];

  while (i > 0 || j > 0) {
    if (i === 0) {
      j--;
    } else if (j === 0) {
      i--;
    } else {
      const minVal = Math.min(
        dtw[i - 1][j],
        Math.min(dtw[i][j - 1], dtw[i - 1][j - 1])
      );
      if (minVal === dtw[i - 1][j - 1]) {
        i--;
        j--;
      } else if (minVal === dtw[i][j - 1]) {
        j--;
      } else {
        i--;
      }
    }
    path.push([i, j]);
  }
  path.reverse();

  // 3. Map matched word timestamps to each cue
  const cueMatches = Array.from({ length: N }, () => []);
  for (const [cueIdx, wordIdx] of path) {
    cueMatches[cueIdx].push(words[wordIdx]);
  }

  // 4. Recalculate cue times based on matched word bounds
  return cues.map((cue, idx) => {
    const matchedWords = cueMatches[idx];
    if (matchedWords.length === 0) return cue;

    // First word starts the cue, last word ends it
    const newStart = matchedWords[0].start;
    const newEnd = matchedWords[matchedWords.length - 1].end;

    return {
      ...cue,
      start: Number(newStart.toFixed(2)),
      end: Number(newEnd.toFixed(2)),
    };
  });
}
