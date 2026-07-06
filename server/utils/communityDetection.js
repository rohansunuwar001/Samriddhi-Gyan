/**
 * Louvain Modularity Community Detection Algorithm.
 * Groups discussion forum participants into study cohorts based on interaction links.
 */

/**
 * Computes communities/cohorts from discussion graph edges.
 * @param {Array<string>} nodes - List of student IDs.
 * @param {Array<{from: string, to: string, weight: number}>} edges - Forum interaction edges.
 * @returns {Object} Mapping node -> communityId.
 */
export function detectLouvainCommunities(nodes, edges) {
  const m = edges.length;
  if (m === 0) {
    // Fallback: Assign each node to its own community
    const fallback = {};
    nodes.forEach((n, idx) => { fallback[n] = idx; });
    return fallback;
  }

  // Degrees calculation
  const degrees = {};
  nodes.forEach((n) => { degrees[n] = 0; });
  edges.forEach((e) => {
    degrees[e.from] = (degrees[e.from] || 0) + (e.weight || 1);
    degrees[e.to] = (degrees[e.to] || 0) + (e.weight || 1);
  });

  const totalEdgeWeightSum = edges.reduce((sum, e) => sum + (e.weight || 1), 0);

  // Initialize partition: each node in its own community
  const communities = {};
  nodes.forEach((n, idx) => {
    communities[n] = idx;
  });

  let improvement = true;
  let iterations = 10; // Prevent infinite loops

  while (improvement && iterations-- > 0) {
    improvement = false;

    for (const node of nodes) {
      const currentComm = communities[node];
      let bestComm = currentComm;
      let maxDeltaQ = 0;

      // Find neighboring communities
      const neighborComms = new Set();
      edges.forEach((e) => {
        if (e.from === node) neighborComms.add(communities[e.to]);
        if (e.to === node) neighborComms.add(communities[e.from]);
      });

      // Test modularity delta for moving node to neighboring communities
      for (const targetComm of neighborComms) {
        if (targetComm === currentComm) continue;

        // Calculate modularity gain: deltaQ
        // dQ = [ki,in / 2m] - [tot * ki / 2m^2]
        let k_i_in = 0;
        edges.forEach((e) => {
          if ((e.from === node || e.to === node) && 
              (communities[e.from] === targetComm || communities[e.to] === targetComm)) {
            k_i_in += e.weight || 1;
          }
        });

        let tot = 0;
        nodes.forEach((n) => {
          if (communities[n] === targetComm) {
            tot += degrees[n] || 0;
          }
        });

        const k_i = degrees[node] || 0;
        const deltaQ = (k_i_in / (2 * totalEdgeWeightSum)) - ((tot * k_i) / (2 * totalEdgeWeightSum * totalEdgeWeightSum));

        if (deltaQ > maxDeltaQ) {
          maxDeltaQ = deltaQ;
          bestComm = targetComm;
        }
      }

      if (bestComm !== currentComm) {
        communities[node] = bestComm;
        improvement = true;
      }
    }
  }

  return communities;
}
