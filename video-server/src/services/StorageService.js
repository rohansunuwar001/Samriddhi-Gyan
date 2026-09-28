// video-server/src/services/StorageService.js
import {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  ListObjectVersionsCommand,
} from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { BaseService } from '../core/BaseService.js';
import { b2Config } from '../config/b2.config.js';

export class StorageService extends BaseService {
  constructor() {
    super('StorageService');
  }

  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.m3u8':
        return 'application/vnd.apple.mpegurl';
      case '.ts':
        return 'video/mp2t';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.webp':
        return 'image/webp';
      case '.mp3':
        return 'audio/mpeg';
      case '.vtt':
        return 'text/vtt';
      default:
        return 'application/octet-stream';
    }
  }

  getAllFiles(dir) {
    const results = [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push(...this.getAllFiles(fullPath));
        } else {
          results.push(fullPath);
        }
      }
    } catch (err) {
      this.error(`Error reading directory ${dir}: ${err.message}`);
    }
    return results;
  }

  /**
   * Stream a raw uploaded video from B2 directly to local disk for FFmpeg.
   */
  async downloadRawVideoToFile(b2Key, localDestPath, onProgress) {
    return this.executeWithTimer(`Download raw video (${b2Key})`, async () => {
      const b2 = b2Config.getClient();
      const bucket = b2Config.bucket;

      const destDir = path.dirname(localDestPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      const response = await b2.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: b2Key,
        })
      );

      const totalBytes = Number(response.ContentLength) || 0;
      let downloadedBytes = 0;

      const writeStream = fs.createWriteStream(localDestPath);

      const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
      const downloadStart = Date.now();
      let lastLog = 0;

      // Track progress
      if (response.Body && typeof response.Body.on === 'function') {
        response.Body.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          const pct = totalBytes > 0 ? Math.min(99, Math.round((downloadedBytes / totalBytes) * 100)) : 0;

          const now = Date.now();
          if (now - lastLog >= 1500 || pct === 99) {
            lastLog = now;
            const elapsed = (now - downloadStart) / 1000;
            const speedMb = elapsed > 0 ? (downloadedBytes / (1024 * 1024) / elapsed).toFixed(1) : 0;
            const downloadedMb = (downloadedBytes / (1024 * 1024)).toFixed(1);
            this.log(`📥 Downloading raw video: ${downloadedMb}MB / ${totalMb}MB (${pct}%) • ${speedMb} MB/s`);
          }

          if (totalBytes > 0 && onProgress) {
            onProgress(pct);
          }
        });
      }

      await pipeline(response.Body, writeStream);
      this.log(`✅ Raw video downloaded: ${totalMb} MB to ${localDestPath}`);
      return localDestPath;
    });
  }

  /**
   * Upload an entire HLS directory to B2 using concurrent worker batches (10-15 workers).
   */
  async uploadHLSParallel(localDir, b2Prefix, onProgress, concurrency = 15) {
    return this.executeWithTimer(`Parallel HLS upload (${b2Prefix})`, async () => {
      const b2 = b2Config.getClient();
      const bucket = b2Config.bucket;
      const files = this.getAllFiles(localDir);
      const total = files.length;

      if (total === 0) {
        throw new Error(`No files found to upload in directory: ${localDir}`);
      }

      const safeConcurrency = Math.min(Number(concurrency) || 6, 6);
      this.log(`Uploading ${total} HLS files with safe concurrency = ${safeConcurrency}`);

      let uploaded = 0;
      let uploadedBytes = 0;
      let thumbRelativePath = null;
      const uploadStart = Date.now();
      let lastLog = 0;
      let uploadAborted = false;

      // Worker queue
      const queue = [...files];
      const worker = async () => {
        while (queue.length > 0) {
          if (uploadAborted) break;
          const filePath = queue.shift();
          if (!filePath) break;

          const relativePath = path.relative(localDir, filePath).replace(/\\/g, '/');
          const b2Key = `${b2Prefix}/${relativePath}`.replace(/^\/+/, '');

          if (/\.(jpg|jpeg|png|webp)$/i.test(relativePath) && !thumbRelativePath) {
            thumbRelativePath = relativePath;
          }

          const fileBuffer = fs.readFileSync(filePath);
          uploadedBytes += fileBuffer.length;
          const isTsSegment = filePath.endsWith('.ts');

          // Retry loop per chunk (up to 3 attempts with backoff)
          let lastErr = null;
          for (let attempt = 1; attempt <= 3; attempt++) {
            if (uploadAborted) break;
            try {
              await b2.send(
                new PutObjectCommand({
                  Bucket: bucket,
                  Key: b2Key,
                  Body: fileBuffer,
                  ContentLength: fileBuffer.length,
                  ContentType: this.getContentType(filePath),
                  CacheControl: isTsSegment
                    ? 'public, max-age=31536000, immutable'
                    : 'public, max-age=3600',
                })
              );
              lastErr = null;
              break;
            } catch (err) {
              lastErr = err;
              this.warn(`Chunk ${relativePath} failed attempt ${attempt}: ${err.message}`);
              await new Promise((r) => setTimeout(r, 1000 * attempt));
            }
          }

          if (lastErr) {
            uploadAborted = true;
            throw new Error(`Failed to upload ${relativePath} to B2 after 3 attempts: ${lastErr.message}`);
          }

          uploaded++;
          const now = Date.now();
          if (now - lastLog >= 1500 || uploaded === total) {
            lastLog = now;
            const elapsed = (now - uploadStart) / 1000;
            const speedMb = elapsed > 0 ? (uploadedBytes / (1024 * 1024) / elapsed).toFixed(1) : 0;
            const pct = Math.min(100, Math.round((uploaded / total) * 100));
            this.log(`☁️  Uploading HLS chunks: ${uploaded}/${total} (${pct}%) • ${speedMb} MB/s`);
          }

          if (onProgress && !uploadAborted) {
            const pct = Math.min(100, Math.round((uploaded / total) * 100));
            onProgress(pct, uploaded, total);
          }
        }
      };

      // Spawn safe concurrency workers
      const workers = Array.from({ length: Math.min(safeConcurrency, files.length) }, () => worker());
      await Promise.all(workers);

      const publicBase = b2Config.getPublicBaseUrl();
      const masterUrl = `${publicBase}/${b2Prefix}/master.m3u8`.replace(/([^:]\/)\/+/g, '$1');
      const thumbnailUrl = thumbRelativePath
        ? `${publicBase}/${b2Prefix}/${thumbRelativePath}`.replace(/([^:]\/)\/+/g, '$1')
        : '';

      return { masterUrl, thumbnailUrl, totalFiles: total };
    });
  }

  /**
   * Permanently delete a file and ALL its historical versions/delete-markers from B2.
   */
  async deleteFile(b2Key) {
    if (!b2Key) return;
    try {
      const b2 = b2Config.getClient();
      const bucket = b2Config.bucket;

      // List all versions and delete markers for this specific key
      const res = await b2.send(
        new ListObjectVersionsCommand({
          Bucket: bucket,
          Prefix: b2Key,
        })
      );

      const toDelete = [];
      for (const v of (res.Versions || [])) {
        if (v.Key === b2Key) {
          toDelete.push({ Key: v.Key, VersionId: v.VersionId });
        }
      }
      for (const m of (res.DeleteMarkers || [])) {
        if (m.Key === b2Key) {
          toDelete.push({ Key: m.Key, VersionId: m.VersionId });
        }
      }

      if (toDelete.length > 0) {
        await b2.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: toDelete },
          })
        );
        this.log(`🗑️ Permanently expunged ${toDelete.length} version(s) of ${b2Key} from B2`);
      } else {
        // Fallback to standard delete if no versions returned
        await b2.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: b2Key,
          })
        );
      }
    } catch (err) {
      this.warn(`Failed to delete B2 file (${b2Key}): ${err.message}`);
    }
  }

  /**
   * Permanently delete an entire prefix/folder and all its versions from B2.
   */
  async deleteFolder(prefix) {
    if (!prefix) return;
    try {
      const b2 = b2Config.getClient();
      const bucket = b2Config.bucket;
      let keyMarker;
      let versionIdMarker;
      let totalDeleted = 0;

      do {
        const res = await b2.send(
          new ListObjectVersionsCommand({
            Bucket: bucket,
            Prefix: prefix,
            KeyMarker: keyMarker,
            VersionIdMarker: versionIdMarker,
          })
        );

        const toDelete = [];
        for (const v of (res.Versions || [])) {
          toDelete.push({ Key: v.Key, VersionId: v.VersionId });
        }
        for (const m of (res.DeleteMarkers || [])) {
          toDelete.push({ Key: m.Key, VersionId: m.VersionId });
        }

        if (toDelete.length > 0) {
          await b2.send(
            new DeleteObjectsCommand({
              Bucket: bucket,
              Delete: { Objects: toDelete },
            })
          );
          totalDeleted += toDelete.length;
        }

        keyMarker = res.NextKeyMarker;
        versionIdMarker = res.NextVersionIdMarker;
      } while (keyMarker || versionIdMarker);

      if (totalDeleted > 0) {
        this.log(`🧹 Permanently expunged ${totalDeleted} files & versions in B2 prefix: ${prefix}`);
      }
    } catch (err) {
      this.warn(`Failed to clean B2 folder (${prefix}): ${err.message}`);
    }
  }
}

export const storageService = new StorageService();
export default storageService;
