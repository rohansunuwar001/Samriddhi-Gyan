/**
 * Gale-Shapley Stable Marriage Algorithm.
 * Pairs students to reviewers (or peer-reviewers) stably based on preferences.
 */

/**
 * Computes a stable matching between proposers (students) and receivers (reviewers).
 * @param {Array<string>} proposers - List of student IDs.
 * @param {Array<string>} receivers - List of reviewer IDs.
 * @param {Object} proposerPrefs - Dict mapping studentId -> ordered list of reviewerIds.
 * @param {Object} receiverPrefs - Dict mapping reviewerId -> ordered list of studentIds.
 * @returns {Object} Dict mapping reviewerId -> studentId.
 */
export function getStableMatches(proposers, receivers, proposerPrefs, receiverPrefs) {
  const matches = {}; // receiverId -> proposerId (current matched proposer)
  
  // Clone preferences to avoid mutating inputs
  const pPrefs = {};
  proposers.forEach(p => {
    pPrefs[p] = Array.isArray(proposerPrefs[p]) ? [...proposerPrefs[p]] : [...receivers];
  });

  const rPrefs = {};
  receivers.forEach(r => {
    rPrefs[r] = Array.isArray(receiverPrefs[r]) ? [...receiverPrefs[r]] : [...proposers];
  });

  // Initialize matches for receivers
  receivers.forEach(r => {
    matches[r] = null;
  });

  const freeProposers = [...proposers];

  // Proposal loop
  while (freeProposers.length > 0) {
    const p = freeProposers.shift();
    const prefs = pPrefs[p];
    
    if (prefs.length === 0) continue; // Proposer has run out of preferences
    const r = prefs.shift(); // Propose to the highest preferred remaining receiver

    const currentMatch = matches[r];
    if (!currentMatch) {
      // Receiver is free, accept proposal tentatively
      matches[r] = p;
    } else {
      const prefsOfR = rPrefs[r];
      // Does Receiver prefer new proposer p over currentMatch?
      const idxNew = prefsOfR.indexOf(p);
      const idxOld = prefsOfR.indexOf(currentMatch);

      if (idxNew !== -1 && (idxOld === -1 || idxNew < idxOld)) {
        // Accept proposal, displace currentMatch
        matches[r] = p;
        freeProposers.push(currentMatch); // Displaced proposer goes back to free list
      } else {
        // Proposal rejected, proposer stays free
        freeProposers.push(p);
      }
    }
  }

  return matches;
}
