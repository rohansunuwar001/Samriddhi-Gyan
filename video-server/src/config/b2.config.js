import { S3Client } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

class B2Config {
  constructor() {
    this.keyId = process.env.B2_KEY_ID || process.env.B2_APPLICATION_KEY_ID;
    this.appKey = process.env.B2_APPLICATION_KEY || process.env.B2_SECRET_ACCESS_KEY;
    this.bucket = process.env.B2_BUCKET_NAME;
    this.region = process.env.B2_REGION || 'us-west-004';
    this.endpoint = process.env.B2_ENDPOINT || `https://s3.${this.region}.backblazeb2.com`;
    this.publicUrl = process.env.B2_PUBLIC_URL;
    this.client = null;
  }

  isConfigured() {
    return Boolean(this.keyId && this.appKey && this.bucket);
  }

  getClient() {
    if (!this.client) {
      if (!this.isConfigured()) {
        throw new Error('[B2Config] Backblaze B2 credentials are not configured in environment variables.');
      }
      this.client = new S3Client({
        region: this.region,
        endpoint: this.endpoint,
        credentials: {
          accessKeyId: this.keyId,
          secretAccessKey: this.appKey,
        },
        requestHandler: new NodeHttpHandler({
          httpsAgent: new https.Agent({
            keepAlive: true,
            maxSockets: 25,
            timeout: 60000,
          }),
          connectionTimeout: 15000,
          requestTimeout: 60000,
        }),
      });
    }
    return this.client;
  }

  getPublicBaseUrl() {
    if (this.publicUrl) {
      return this.publicUrl.replace(/\/+$/, '');
    }
    if (this.endpoint) {
      return `${this.endpoint.replace(/\/+$/, '')}/${this.bucket}`;
    }
    return `https://${this.bucket}.s3.${this.region}.backblazeb2.com`;
  }
}

export const b2Config = new B2Config();
export default b2Config;
