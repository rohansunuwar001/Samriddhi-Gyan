// server/scripts/cleanB2OrphanedFiles.js
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  ListMultipartUploadsCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

async function cleanB2() {
  const region = process.env.B2_REGION || 'us-east-005';
  const bucket = process.env.B2_BUCKET_NAME || 'samriddhi-gyan-videos';

  const client = new S3Client({
    region,
    endpoint: `https://s3.${region}.backblazeb2.com`,
    credentials: {
      accessKeyId: process.env.B2_KEY_ID,
      secretAccessKey: process.env.B2_APPLICATION_KEY,
    },
  });

  console.log(`🔍 Scanning Backblaze bucket "${bucket}" for temporary raw uploads & incomplete multipart uploads...`);

  // 1. Abort any hanging uncompleted multipart uploads
  try {
    const mpRes = await client.send(new ListMultipartUploadsCommand({ Bucket: bucket }));
    const uploads = mpRes.Uploads || [];
    console.log(`Found ${uploads.length} incomplete multipart uploads.`);
    for (const u of uploads) {
      console.log(`🧹 Aborting incomplete multipart upload for key: ${u.Key} (UploadId: ${u.UploadId})`);
      await client.send(new AbortMultipartUploadCommand({
        Bucket: bucket,
        Key: u.Key,
        UploadId: u.UploadId,
      }));
    }
  } catch (err) {
    console.warn('Multipart scan warning:', err.message);
  }

  // 2. Scan and delete any files in "raw-uploads/"
  try {
    let continuationToken;
    let totalDeleted = 0;
    let totalBytesSaved = 0;

    do {
      const listRes = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: 'raw-uploads/',
          ContinuationToken: continuationToken,
        })
      );

      const items = listRes.Contents || [];
      if (items.length > 0) {
        console.log(`Found ${items.length} files in raw-uploads/ to delete:`);
        for (const item of items) {
          const mb = (item.Size / (1024 * 1024)).toFixed(2);
          console.log(` - ${item.Key} (${mb} MB)`);
          totalBytesSaved += item.Size;
        }

        const deleteParams = {
          Bucket: bucket,
          Delete: {
            Objects: items.map((i) => ({ Key: i.Key })),
          },
        };

        await client.send(new DeleteObjectsCommand(deleteParams));
        totalDeleted += items.length;
      }

      continuationToken = listRes.NextContinuationToken;
    } while (continuationToken);

    const savedMb = (totalBytesSaved / (1024 * 1024)).toFixed(2);
    console.log(`\n🎉 Cleanup complete! Deleted ${totalDeleted} raw video files, freed ${savedMb} MB of B2 storage.`);
  } catch (err) {
    console.error('Error during raw-uploads cleanup:', err.message);
  }
}

cleanB2();
