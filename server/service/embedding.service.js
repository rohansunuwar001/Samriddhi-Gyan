import { pipeline } from '@xenova/transformers';


class EmbeddingPipeline {
  static instance = null;

  static async getInstance() {
    if (this.instance === null) {
      this.instance = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return this.instance;
  }
}


export async function generateEmbedding(text) {
  const extractor = await EmbeddingPipeline.getInstance();

  const output = await extractor(text, {
    pooling: 'mean',
    normalize: true,
  });

  return Array.from(output.data);
}