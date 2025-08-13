import { pipeline } from '@xenova/transformers';

// Singleton to ensure the model is loaded only once.
class EmbeddingPipeline {
  static instance = null;

  static async getInstance() {
    if (this.instance === null) {
      this.instance = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return this.instance;
  }
}

/**
 * Generates an embedding for a given text using a local Transformers.js model.
 * @param {string} text The text to generate an embedding for.
 * @returns {Promise<number[]>} A promise that resolves to the embedding vector.
 */
export async function generateEmbedding(text) {
  const extractor = await EmbeddingPipeline.getInstance();

  const output = await extractor(text, {
    pooling: 'mean',
    normalize: true,
  });

  return Array.from(output.data);
}