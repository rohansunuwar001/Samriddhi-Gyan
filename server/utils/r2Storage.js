import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { createReadStream, readdirSync, statSync } from 'fs';
import path from 'path';

/**
 * Cloudflare R2 client.
 * R2 is S3-compatible, so we use the AWS SDK with R2's endpoint.
 * Zero egress fees — every byte served to students costs nothing extra.
 *
 * Required env vars:
 *   R2_ACCOUNT_ID         — found on your Cloudflare dashboard
 *   R2_ACCESS_KEY_ID      — R2 API token Access Key ID
 *   R2_SECRET_ACCESS_KEY  — R2 API token Secret Access Key
 *   R2_BUCKET_NAME        — name of your R2 bucket
 *   R2_PUBLIC_URL         — public URL of your bucket (e.g. https://pub-xxx.r2.dev)
 */
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;

/** Map file extension to correct MIME type for HLS playback */
const getContentType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.m3u8') return 'application/vnd.apple.mpegurl';
  if (ext === '.ts')   return 'video/mp2t';
  return 'application/octet-stream';
};

/** Recursively collect all file paths under a directory */
const getAllFiles = (dir) => {
  const result = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...getAllFiles(fullPath));
    else result.push(fullPath);
  }
  return result;
};

/**
 * Upload an entire HLS output directory to R2.
 *
 * Directory structure uploaded:
 *   r2Prefix/master.m3u8
 *   r2Prefix/360p/index.m3u8
 *   r2Prefix/360p/seg_0001.ts
 *   r2Prefix/720p/index.m3u8
 *   ...
 *   r2Prefix/2160p/index.m3u8
 *   ...
 *
 * Streams each file directly from disk — never loads the entire video into RAM.
 *
 * @param {string}   localDir    - Local temp directory containing HLS output
 * @param {string}   r2Prefix    - R2 key prefix, e.g. "lectures/64abc123"
 * @param {Function} onProgress  - Called with 0-100 progress during upload phase
 * @returns {string} Public URL of the master playlist
 */
export const uploadHLSToR2 = async (localDir, r2Prefix, onProgress) => {
  const files = getAllFiles(localDir);
  const total = files.length;
  let uploaded = 0;

  console.log(`[R2] Uploading ${total} files to ${r2Prefix}/...`);

  for (const filePath of files) {
    const relativePath = path.relative(localDir, filePath).replace(/\\/g, '/');
    const r2Key = `${r2Prefix}/${relativePath}`;

    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: r2Key,
        Body: createReadStream(filePath),
        ContentType: getContentType(filePath),
        // Cache HLS segments aggressively (they never change once created)
        // Cache the master playlist less aggressively (could be re-generated if reprocessed)
        CacheControl: filePath.endsWith('.ts')
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=3600',
      })
    );

    uploaded++;
    onProgress?.(Math.round((uploaded / total) * 100));
    if (uploaded % 10 === 0) {
      console.log(`[R2] Uploaded ${uploaded}/${total}`);
    }
  }

  const masterUrl = `${process.env.R2_PUBLIC_URL}/${r2Prefix}/master.m3u8`;
  console.log(`[R2] Upload complete. Master URL: ${masterUrl}`);
  return masterUrl;
};

/**
 * Delete all R2 objects for a lecture.
 * Called when a lecture is deleted — cleans up all HLS segments and playlists.
 * Handles pagination for lectures with many segments (long videos).
 *
 * @param {string} r2Prefix - e.g. "lectures/64abc123"
 */
export const deleteHLSFromR2 = async (r2Prefix) => {
  const objectsToDelete = [];
  let continuationToken;

  // Paginate through all objects with this prefix (S3 ListObjects max 1000/page)
  do {
    const response = await r2.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: r2Prefix,
        ContinuationToken: continuationToken,
      })
    );

    if (response.Contents?.length) {
      objectsToDelete.push(...response.Contents.map((obj) => ({ Key: obj.Key })));
    }
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  if (objectsToDelete.length === 0) {
    console.log(`[R2] No objects found under ${r2Prefix}`);
    return;
  }

  // DeleteObjects accepts max 1000 keys per request
  for (let i = 0; i < objectsToDelete.length; i += 1000) {
    await r2.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: objectsToDelete.slice(i, i + 1000) },
      })
    );
  }

  console.log(`[R2] Deleted ${objectsToDelete.length} objects from ${r2Prefix}`);
};