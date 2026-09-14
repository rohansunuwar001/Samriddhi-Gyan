// server/service/embedding.service.js

import { pipeline } from '@xenova/transformers';
import { BaseService } from '../core/base.service.js';

class EmbeddingPipeline {
  static instance = null;

  static async getInstance() {
    if (this.instance === null) {
      this.instance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return this.instance;
  }
}

export class EmbeddingService extends BaseService {
  constructor() {
    super(null);
  }

  async generateEmbedding(text) {
    const extractor = await EmbeddingPipeline.getInstance();
    const output = await extractor(text, {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(output.data);
  }
}

export const embeddingService = new EmbeddingService();

export const generateEmbedding = embeddingService.generateEmbedding.bind(embeddingService);