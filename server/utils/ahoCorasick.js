export class AhoCorasickTagger {
  constructor(patterns = []) {
    this.patterns = Array.from(new Set(patterns.map((p) => p && p.trim()).filter(Boolean)));
  }

  tagText(text) {
    if (!this.patterns.length || !text || typeof text !== "string") return [];
    const lowerText = text.toLowerCase();
    return this.patterns.filter((p) => lowerText.includes(p.toLowerCase()));
  }
}
