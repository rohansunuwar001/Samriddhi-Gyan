// server/scripts/configureB2Lifecycle.js
import {
  S3Client,
  PutBucketLifecycleConfigurationCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

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

async function setLifecycle() {
  console.log(`Setting automated lifecycle policy for bucket "${bucket}"...`);
  const params = {
    Bucket: bucket,
    LifecycleConfiguration: {
      Rules: [
        {
          ID: 'ExpireRawUploads',
          Filter: { Prefix: 'raw-uploads/' },
          Status: 'Enabled',
          Expiration: { Days: 1 },
          NoncurrentVersionExpiration: { NoncurrentDays: 1 },
          AbortIncompleteMultipartUpload: { DaysAfterInitiation: 1 },
        },
        {
          ID: 'DeleteExpiredMarkersRawUploads',
          Filter: { Prefix: 'raw-uploads/' },
          Status: 'Enabled',
          Expiration: { ExpiredObjectDeleteMarker: true },
        },
      ],
    },
  };

  await client.send(new PutBucketLifecycleConfigurationCommand(params));
  console.log('✅ Successfully applied lifecycle rules to Backblaze B2 bucket!');

  const check = await client.send(new GetBucketLifecycleConfigurationCommand({ Bucket: bucket }));
  console.log('Active Bucket Lifecycle Rules:', JSON.stringify(check.Rules, null, 2));
}

setLifecycle().catch(console.error);
