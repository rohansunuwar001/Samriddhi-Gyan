/**
 * Apriori Association Rule Mining Algorithm.
 * Identifies frequently bought course bundles from checkout transactions data.
 */

/**
 * Calculates frequent itemsets and association rules from purchase transactions.
 * @param {Array<Array<string>>} transactions - List of transactions, where each transaction is an array of courseIds.
 * @param {number} minSupport - Minimum support threshold (0.0 to 1.0).
 * @param {number} minConfidence - Minimum confidence threshold (0.0 to 1.0).
 * @returns {Array<Object>} List of matched rules.
 */
export function getAprioriRules(transactions, minSupport = 0.1, minConfidence = 0.5) {
  const N = transactions.length;
  if (N === 0) return [];

  // 1. Generate size 1 frequent itemsets (C1 & L1)
  const itemCounts = {};
  transactions.forEach((tx) => {
    tx.forEach((item) => {
      itemCounts[item] = (itemCounts[item] || 0) + 1;
    });
  });

  // Filter items meeting support
  const frequent1 = {};
  Object.keys(itemCounts).forEach((item) => {
    const support = itemCounts[item] / N;
    if (support >= minSupport) {
      frequent1[item] = support;
    }
  });

  const freqItems = Object.keys(frequent1);
  const rules = [];

  // 2. Generate size 2 frequent itemsets (pairs) and calculate rules
  for (let i = 0; i < freqItems.length; i++) {
    for (let j = i + 1; j < freqItems.length; j++) {
      const itemA = freqItems[i];
      const itemB = freqItems[j];

      // Calculate support of pair (A, B)
      let pairCount = 0;
      transactions.forEach((tx) => {
        if (tx.includes(itemA) && tx.includes(itemB)) {
          pairCount++;
        }
      });

      const supportPair = pairCount / N;

      if (supportPair >= minSupport) {
        // Calculate Rule: A -> B
        // Confidence(A -> B) = Support(A, B) / Support(A)
        const confAToB = supportPair / frequent1[itemA];
        const liftAToB = confAToB / frequent1[itemB];

        if (confAToB >= minConfidence) {
          rules.push({
            from: itemA,
            to: itemB,
            support: supportPair,
            confidence: confAToB,
            lift: liftAToB
          });
        }

        // Calculate Rule: B -> A
        const confBToA = supportPair / frequent1[itemB];
        const liftBToA = confBToA / frequent1[itemA];

        if (confBToA >= minConfidence) {
          rules.push({
            from: itemB,
            to: itemA,
            support: supportPair,
            confidence: confBToA,
            lift: liftBToA
          });
        }
      }
    }
  }

  return rules;
}
