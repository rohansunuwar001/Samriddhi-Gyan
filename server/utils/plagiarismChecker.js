/**
 * MinHash & Locality Sensitive Hashing (LSH) Plagiarism Checker.
 * Matches student assignment text duplicates in near-linear O(N) time.
 */

/**
 * Computes word shingles (n-grams) from text.
 * @param {string} text 
 * @param {number} k 
 * @returns {Set<string>} Set of shingles.
 */
function getShingles(text, k = 5) {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  const shingles = new Set();
  for (let i = 0; i <= clean.length - k; i++) {
    shingles.add(clean.slice(i, i + k).join(" "));
  }
  return shingles;
}

/**
 * Basic hash function mapping string to a 32-bit positive integer.
 */
function simpleHash(str, seed) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i) + seed) % 2147483647;
  }
  return Math.abs(hash);
}

/**
 * Compares document signatures to identify candidate duplicates.
 * @param {string} docText - The student's text submission.
 * @param {Array<{id: string, text: string}>} refDocs - Library of prior submissions to compare against.
 * @param {number} threshold - Jaccard similarity threshold above which we flag plagiarism (0.0 to 1.0).
 * @returns {Array<{id: string, similarity: number}>} List of flagged matches.
 */
export function checkPlagiarism(docText, refDocs, threshold = 0.5) {
  const kShingles = 5;
  const numHashes = 20;

  const targetShingles = getShingles(docText, kShingles);
  if (targetShingles.size === 0) return [];

  // Generate signature for target document
  const targetSig = Array(numHashes).fill(Infinity);
  for (let h = 0; h < numHashes; h++) {
    targetShingles.forEach((shingle) => {
      targetSig[h] = Math.min(targetSig[h], simpleHash(shingle, h));
    });
  }

  const results = [];

  refDocs.forEach((ref) => {
    const refShingles = getShingles(ref.text, kShingles);
    if (refShingles.size === 0) return;

    // Generate signature for reference document
    const refSig = Array(numHashes).fill(Infinity);
    for (let h = 0; h < numHashes; h++) {
      refShingles.forEach((shingle) => {
        refSig[h] = Math.min(refSig[h], simpleHash(shingle, h));
      });
    }

    // Compute estimated Jaccard Similarity using MinHash signature overlaps
    let matches = 0;
    for (let h = 0; h < numHashes; h++) {
      if (targetSig[h] === refSig[h]) {
        matches++;
      }
    }

    const similarity = matches / numHashes;

    if (similarity >= threshold) {
      results.push({
        id: ref.id,
        similarity: Number(similarity.toFixed(2))
      });
    }
  });

  return results;
}
