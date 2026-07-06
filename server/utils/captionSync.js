/**
 * Dynamic Time Warping (DTW) Sequence Alignment.
 * Automatically aligns video audio timeframes to subtitle text words.
 */

/**
 * Aligns audio signal frames to text phoneme sequence.
 * @param {Array<number>} audioFrames - Numeric time series extracted from video audio (e.g. volume or pitch steps).
 * @param {Array<number>} phonemes - Numeric phoneme or character sequence keys of target subtitle words.
 * @returns {Array<Array<number>>} Optimal alignment path mapping: list of pairs [audioFrameIdx, phonemeIdx].
 */
export function alignAudioToText(audioFrames, phonemes) {
  const n = audioFrames.length;
  const m = phonemes.length;

  if (n === 0 || m === 0) return [];

  // Create DTW cost matrix filled with Infinity
  const dtw = Array.from({ length: n + 1 }, () => Array(m + 1).fill(Infinity));
  dtw[0][0] = 0;

  // Calculate dynamic programming cumulative distance matrix
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      // Local distance measure: absolute differences
      const cost = Math.abs(audioFrames[i - 1] - phonemes[j - 1]);
      dtw[i][j] = cost + Math.min(
        dtw[i - 1][j],     // insertion
        dtw[i][j - 1],     // deletion
        dtw[i - 1][j - 1]  // match
      );
    }
  }

  // Backtrack to extract the optimal warping path
  const path = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    path.push([i - 1, j - 1]);

    if (i === 1 && j === 1) {
      break;
    } else if (i === 1) {
      j--;
    } else if (j === 1) {
      i--;
    } else {
      const minVal = Math.min(
        dtw[i - 1][j],
        dtw[i][j - 1],
        dtw[i - 1][j - 1]
      );
      if (minVal === dtw[i - 1][j - 1]) {
        i--;
        j--;
      } else if (minVal === dtw[i - 1][j]) {
        i--;
      } else {
        j--;
      }
    }
  }

  // Return path in chronological order
  return path.reverse();
}
