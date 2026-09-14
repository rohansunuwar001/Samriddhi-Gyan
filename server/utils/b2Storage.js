import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { createReadStream, readdirSync } from 'fs';
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

  console.log(`[B2] Uploading ${total} files to prefix "${b2Prefix}" in bucket "${bucket}"...`);

  let uploaded = 0;
  let thumbRelativePath = null;

  for (const filePath of files) {
    const relativePath = path.relative(localDir, filePath).replace(/\\/g, '/');
    const b2Key = `${b2Prefix}/${relativePath}`.replace(/^\/+/, '');

    if (/\.(jpg|jpeg|png|webp)$/i.test(relativePath) && !thumbRelativePath) {
      thumbRelativePath = relativePath;
    }

    const isTsSegment = filePath.endsWith('.ts');

    await b2.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: b2Key,
        Body: createReadStream(filePath),
        ContentType: getContentType(filePath),
        // Cache HLS segments aggressively; master playlist/manifest can be cached shortly
        CacheControl: isTsSegment
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=3600',
      })
    );

    uploaded++;
    if (onProgress) {
      onProgress(Math.round((uploaded / total) * 100));
    }
    if (uploaded % 10 === 0 || uploaded === total) {
      console.log(`[B2] Uploaded ${uploaded}/${total} files`);
    }
  }

  const publicBase = getB2PublicBaseUrl();
  const masterUrl = `${publicBase}/${b2Prefix}/master.m3u8`;
  const thumbnailUrl = thumbRelativePath ? `${publicBase}/${b2Prefix}/${thumbRelativePath}` : '';

  console.log(`[B2] Upload complete! Master URL: ${masterUrl}`);
  return { masterUrl, thumbnailUrl };
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
