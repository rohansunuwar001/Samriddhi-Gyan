function getShingles(text, k = 5) {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  const shingles = new Set();
  for (let i = 0; i <= clean.length - k; i++) {
    shingles.add(clean.slice(i, i + k).join(" "));
  }
  return shingles;
}

function simpleHash(str, seed) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i) + seed) % 2147483647;
  }
  return Math.abs(hash);
}

function computeSignature(shingles, numHashes = 20) {
  const sig = Array(numHashes).fill(Infinity);
  shingles.forEach((shingle) => {
    for (let h = 0; h < numHashes; h++) {
      sig[h] = Math.min(sig[h], simpleHash(shingle, h));
    }
  });
  return sig;
}

export function checkPlagiarism(docText, refDocs, threshold = 0.5) {
  const targetShingles = getShingles(docText);
  if (targetShingles.size === 0) return [];

  const targetSig = computeSignature(targetShingles);
  const results = [];

  refDocs.forEach((ref) => {
    const refShingles = getShingles(ref.text);
    if (refShingles.size === 0) return;

    const refSig = computeSignature(refShingles);
    const matches = targetSig.filter((val, h) => val === refSig[h]).length;
    const similarity = matches / 20;

    if (similarity >= threshold) {
      results.push({ id: ref.id, similarity: Number(similarity.toFixed(2)) });
    }
  });

  return results;
}
