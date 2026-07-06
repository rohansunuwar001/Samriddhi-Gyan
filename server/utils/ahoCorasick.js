class TrieNode {
  constructor() {
    this.children = {};
    this.fail = null;
    this.output = [];
  }
}

export class AhoCorasickTagger {
  /**
   * @param {Array<string>} patterns - Dictionary of keywords to tag.
   */
  constructor(patterns = []) {
    this.root = new TrieNode();
    this.isBuilt = false;

    if (patterns.length > 0) {
      this.buildTrie(patterns);
    }
  }

  /**
   * Inserts pattern list and constructs the failure links.
   * @param {Array<string>} patterns 
   */
  buildTrie(patterns) {
    patterns.forEach((pattern) => {
      const lowerPattern = pattern.trim().toLowerCase();
      if (!lowerPattern) return;

      let curr = this.root;
      for (const char of lowerPattern) {
        if (!curr.children[char]) {
          curr.children[char] = new TrieNode();
        }
        curr = curr.children[char];
      }
      curr.output.push(pattern); // Store original casing/name
    });

    this.buildFailureLinks();
    this.isBuilt = true;
  }

  /**
   * BFS algorithm to link suffix/failure nodes.
   */
  buildFailureLinks() {
    this.root.fail = this.root;
    const queue = [];

    // Initialize level 1 children
    Object.keys(this.root.children).forEach((char) => {
      const node = this.root.children[char];
      node.fail = this.root;
      queue.push(node);
    });

    while (queue.length > 0) {
      const curr = queue.shift();

      Object.keys(curr.children).forEach((char) => {
        const child = curr.children[char];
        let failNode = curr.fail;

        // Traverse failure links until matching transition node is found
        while (failNode !== this.root && !failNode.children[char]) {
          failNode = failNode.fail;
        }

        child.fail = failNode.children[char] || this.root;
        // Merge output terms from the suffix match node
        child.output = child.output.concat(child.fail.output);
        queue.push(child);
      });
    }
  }

  /**
   * Scans a text block for patterns in a single linear pass.
   * @param {string} text - The content text to search.
   * @returns {Array<string>} Set of unique matched keywords.
   */
  tagText(text) {
    if (!this.isBuilt) return [];
    if (!text || typeof text !== "string") return [];

    const lowerText = text.toLowerCase();
    const matchedSet = new Set();
    let curr = this.root;

    for (let i = 0; i < lowerText.length; i++) {
      const char = lowerText[i];

      while (curr !== this.root && !curr.children[char]) {
        curr = curr.fail;
      }

      curr = curr.children[char] || this.root;

      if (curr.output.length > 0) {
        curr.output.forEach((pattern) => {
          matchedSet.add(pattern);
        });
      }
    }

    return Array.from(matchedSet);
  }
}
