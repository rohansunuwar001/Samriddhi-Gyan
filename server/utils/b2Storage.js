import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import https from 'https';
import { createReadStream, readFileSync, readdirSync } from 'fs';
import path from 'path';

/**
 * Check if Backblaze B2 credentials and bucket configurations are present.
 */
export const isB2Configured = () => {
  const keyId = process.env.B2_KEY_ID || process.env.B2_APPLICATION_KEY_ID;
  const appKey = process.env.B2_APPLICATION_KEY || process.env.B2_SECRET_ACCESS_KEY;
  const bucket = process.env.B2_BUCKET_NAME;
  return Boolean(keyId && appKey && bucket);
};

/**
 * Get S3Client configured for Backblaze B2 (S3-compatible API).
 */
const getB2Client = () => {
  const keyId = process.env.B2_KEY_ID || process.env.B2_APPLICATION_KEY_ID;
  const appKey = process.env.B2_APPLICATION_KEY || process.env.B2_SECRET_ACCESS_KEY;
  const region = process.env.B2_REGION || 'us-west-004';
  const endpoint =
    process.env.B2_ENDPOINT || `https://s3.${region}.backblazeb2.com`;

  return new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId: keyId,
      secretAccessKey: appKey,
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
};

/** Map file extension to correct MIME type for HLS playback */
const getContentType = (filePath) => {
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
};

/** Recursively collect all file paths under a directory */
const getAllFiles = (dir) => {
  const result = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        result.push(...getAllFiles(fullPath));
      } else {
        result.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`[B2] Error reading directory ${dir}:`, err.message);
  }
  return result;
};

/**
 * Determine the public base URL for accessing stored objects.
 */
const getB2PublicBaseUrl = () => {
  if (process.env.B2_PUBLIC_URL) {
    return process.env.B2_PUBLIC_URL.replace(/\/+$/, '');
  }

  const bucket = process.env.B2_BUCKET_NAME;
  const region = process.env.B2_REGION || 'us-west-004';

  if (process.env.B2_ENDPOINT) {
    const rawEndpoint = process.env.B2_ENDPOINT.replace(/\/+$/, '');
    return `${rawEndpoint}/${bucket}`;
  }

  return `https://${bucket}.s3.${region}.backblazeb2.com`;
};

/**
 * Upload an entire HLS output directory to Backblaze B2.
 *
 * Directory structure uploaded:
 *   b2Prefix/master.m3u8
 *   b2Prefix/360p/index.m3u8
 *   b2Prefix/360p/seg_0001.ts
 *   b2Prefix/720p/index.m3u8
 *   ...
 *   b2Prefix/thumb.jpg
 *
 * Streams each file directly from disk.
 *
 * @param {string}   localDir    - Local directory containing HLS files
 * @param {string}   b2Prefix    - B2 key prefix, e.g. "lectures/64abc123" or "promo/course123"
 * @param {Function} onProgress  - Progress callback (0 - 100)
 * @returns {Promise<{ masterUrl: string, thumbnailUrl: string }>}
 */
export const uploadHLSToB2 = async (localDir, b2Prefix, onProgress) => {
  if (!isB2Configured()) {
    throw new Error('Backblaze B2 is not configured in environment variables.');
  }

  const b2 = getB2Client();
  const bucket = process.env.B2_BUCKET_NAME;
  const files = getAllFiles(localDir);
  const total = files.length;

  if (total === 0) {
    throw new Error(`No files found to upload in directory: ${localDir}`);
  }

  const safeConcurrency = 6;
  console.log(`[B2] Uploading ${total} files to prefix "${b2Prefix}" in bucket "${bucket}" with safe concurrency = ${safeConcurrency}...`);

  let uploaded = 0;
  let thumbRelativePath = null;
  const queue = [...files];

  const worker = async () => {
    while (queue.length > 0) {
      const filePath = queue.shift();
      if (!filePath) break;

      const relativePath = path.relative(localDir, filePath).replace(/\\/g, '/');
      const b2Key = `${b2Prefix}/${relativePath}`.replace(/^\/+/, '');

      if (/\.(jpg|jpeg|png|webp)$/i.test(relativePath) && !thumbRelativePath) {
        thumbRelativePath = relativePath;
      }

      const fileBuffer = readFileSync(filePath);
      const isTsSegment = filePath.endsWith('.ts');

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await b2.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: b2Key,
              Body: fileBuffer,
              ContentLength: fileBuffer.length,
              ContentType: getContentType(filePath),
              CacheControl: isTsSegment
                ? 'public, max-age=31536000, immutable'
                : 'public, max-age=3600',
            })
          );
          break;
        } catch (err) {
          if (attempt === 3) throw err;
          console.warn(`[B2] Chunk ${relativePath} failed attempt ${attempt}, retrying...`);
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }

      uploaded++;
      if (onProgress) {
        onProgress(Math.round((uploaded / total) * 100));
      }
      if (uploaded % 20 === 0 || uploaded === total) {
        console.log(`[B2] Uploaded ${uploaded}/${total} files`);
      }
    }
  };

  const workers = Array.from({ length: Math.min(safeConcurrency, files.length) }, () => worker());
  await Promise.all(workers);

  const publicBase = getB2PublicBaseUrl();
  const masterUrl = `${publicBase}/${b2Prefix}/master.m3u8`;
  const thumbnailUrl = thumbRelativePath ? `${publicBase}/${b2Prefix}/${thumbRelativePath}` : '';

  console.log(`[B2] Upload complete! Master URL: ${masterUrl}`);
  return { masterUrl, thumbnailUrl };
};

/**
 * ─── S3 / B2 Multipart Chunked Upload Helpers ──────────────────────────────
 */

/**
 * Initialize a multipart upload in Backblaze B2.
 */
export const initiateMultipartUpload = async (key, contentType = 'video/mp4') => {
  if (!isB2Configured()) {
    throw new Error('Backblaze B2 is not configured in environment variables.');
  }

  const b2 = getB2Client();
  const bucket = process.env.B2_BUCKET_NAME;

  const command = new CreateMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const response = await b2.send(command);
  return {
    uploadId: response.UploadId,
    key: response.Key,
  };
};

/**
 * Generate pre-signed PUT URLs for each chunk part of a multipart upload.
 */
export const getMultipartPartSignedUrls = async (key, uploadId, totalParts, expiresIn = 7200) => {
  if (!isB2Configured()) {
    throw new Error('Backblaze B2 is not configured in environment variables.');
  }

  const b2 = getB2Client();
  const bucket = process.env.B2_BUCKET_NAME;

  const promises = [];
  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const command = new UploadPartCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });

    promises.push(
      getSignedUrl(b2, command, { expiresIn }).then((url) => ({
        partNumber,
        url,
      }))
    );
  }

  return await Promise.all(promises);
};

/**
 * Complete a multipart upload once all parts are uploaded.
 * Assembles the full file in Backblaze B2.
 */
export const completeMultipartUpload = async (key, uploadId, parts) => {
  if (!isB2Configured()) {
    throw new Error('Backblaze B2 is not configured in environment variables.');
  }

  const b2 = getB2Client();
  const bucket = process.env.B2_BUCKET_NAME;

  // Parts must be sorted in ascending order of PartNumber
  const sortedParts = parts
    .map((p) => ({
      PartNumber: Number(p.PartNumber || p.partNumber),
      ETag: p.ETag || p.etag,
    }))
    .sort((a, b) => a.PartNumber - b.PartNumber);

  const command = new CompleteMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: sortedParts,
    },
  });

  const response = await b2.send(command);
  return {
    location: response.Location,
    key: response.Key,
    bucket: response.Bucket,
  };
};

/**
 * Abort a multipart upload in Backblaze B2 (clean up uncompleted parts).
 */
export const abortMultipartUpload = async (key, uploadId) => {
  if (!isB2Configured()) return;
  try {
    const b2 = getB2Client();
    const bucket = process.env.B2_BUCKET_NAME;
    await b2.send(
      new AbortMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
      })
    );
  } catch (err) {
    console.warn(`[B2] Failed to abort multipart upload ${uploadId}: ${err.message}`);
  }
};

/**
 * Delete all Backblaze B2 objects under a given prefix.
 * Handles pagination for directories containing many HLS segment files.
 *
 * @param {string} b2Prefix - e.g. "lectures/64abc123" or "promo/course123"
 */
export const deleteHLSFromB2 = async (b2Prefix) => {
  if (!isB2Configured()) {
    console.warn('[B2] Backblaze B2 credentials not configured. Skipping remote deletion.');
    return;
  }

  const b2 = getB2Client();
  const bucket = process.env.B2_BUCKET_NAME;
  const normalizedPrefix = b2Prefix.replace(/^\/+/, '').replace(/\/+$/, '') + '/';

  console.log(`[B2] Deleting objects with prefix "${normalizedPrefix}" from bucket "${bucket}"...`);

  const objectsToDelete = [];
  let continuationToken;

  try {
    do {
      const response = await b2.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: normalizedPrefix,
          ContinuationToken: continuationToken,
        })
      );

      if (response.Contents?.length) {
        objectsToDelete.push(...response.Contents.map((obj) => ({ Key: obj.Key })));
      }
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    if (objectsToDelete.length === 0) {
      console.log(`[B2] No objects found under prefix "${normalizedPrefix}"`);
      return;
    }

    // DeleteObjects accepts max 1000 keys per batch
    for (let i = 0; i < objectsToDelete.length; i += 1000) {
      const batch = objectsToDelete.slice(i, i + 1000);
      await b2.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: batch },
        })
      );
    }

    console.log(`[B2] Successfully deleted ${objectsToDelete.length} objects from "${normalizedPrefix}"`);
  } catch (err) {
    console.error(`[B2] Error deleting objects with prefix "${normalizedPrefix}":`, err.message);
  }
};

/**
 * Upload a single raw file (such as a promotional video) to Backblaze B2.
 *
 * @param {string} filePath - Absolute path to local file
 * @param {string} b2Key    - Destination key in B2
 * @returns {Promise<string>} b2Key
 */
export const uploadRawFileToB2 = async (filePath, b2Key) => {
  if (!isB2Configured()) {
    console.warn('[B2] Backblaze B2 credentials not configured. Skipping raw file upload.');
    return null;
  }

  const b2 = getB2Client();
  const bucket = process.env.B2_BUCKET_NAME;
  const fileBuffer = readFileSync(filePath);

  console.log(`[B2] Uploading raw file "${filePath}" to B2 key "${b2Key}" (${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB)...`);

  await b2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: b2Key,
      Body: fileBuffer,
      ContentLength: fileBuffer.length,
      ContentType: getContentType(filePath),
    })
  );

  console.log(`[B2] Raw file successfully uploaded to "${b2Key}"`);
  return b2Key;
};
