// server/scripts/configureB2Cors.js
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function configureB2NativeCors() {
  const keyId = process.env.B2_KEY_ID;
  const appKey = process.env.B2_APPLICATION_KEY;
  const bucketName = process.env.B2_BUCKET_NAME || 'samriddhi-gyan-videos';

  console.log('1. Authorizing with Backblaze Native API...');
  const basicAuth = Buffer.from(`${keyId}:${appKey}`).toString('base64');

  const authRes = await axios.get('https://api.backblazeb2.com/b2api/v3/b2_authorize_account', {
    headers: {
      Authorization: `Basic ${basicAuth}`,
    },
  });

  console.log('Auth response keys:', Object.keys(authRes.data));
  console.log('API URL:', authRes.data.apiInfo?.storageApi?.apiUrl || authRes.data.apiUrl);

  const apiUrl = authRes.data.apiInfo?.storageApi?.apiUrl || authRes.data.apiUrl;
  const authorizationToken = authRes.data.authorizationToken;
  const accountId = authRes.data.accountId;

  console.log(`2. Getting bucket ID for "${bucketName}" from ${apiUrl}...`);
  const bucketsRes = await axios.post(
    `${apiUrl}/b2api/v3/b2_list_buckets`,
    { accountId, bucketName },
    { headers: { Authorization: authorizationToken } }
  );

  const bucket = bucketsRes.data.buckets.find((b) => b.bucketName === bucketName);
  if (!bucket) {
    throw new Error(`Bucket "${bucketName}" not found in account.`);
  }

  const bucketId = bucket.bucketId;
  console.log(`✅ Found Bucket ID: ${bucketId}`);

  console.log('3. Updating CORS rules on bucket...');
  const corsRules = [
    {
      corsRuleName: 'allowAllWebOrigins',
      allowedOrigins: ['*'],
      allowedOperations: [
        'b2_upload_file',
        'b2_upload_part',
        'b2_download_file_by_name',
        'b2_download_file_by_id',
        's3_put',
        's3_post',
        's3_head',
        's3_get',
        's3_delete',
      ],
      allowedHeaders: ['*'],
      exposeHeaders: ['ETag', 'etag', 'x-amz-request-id', 'Content-Range', 'Accept-Ranges'],
      maxAgeSeconds: 3600,
    },
  ];

  const updateRes = await axios.post(
    `${apiUrl}/b2api/v3/b2_update_bucket`,
    {
      accountId,
      bucketId,
      corsRules,
    },
    { headers: { Authorization: authorizationToken } }
  );

  console.log('🎉 Successfully configured Backblaze B2 CORS rules!');
  console.log('Updated CORS Rules:', JSON.stringify(updateRes.data.corsRules, null, 2));
}

configureB2NativeCors().catch((err) => {
  console.error('Error configuring B2 CORS:', err.response?.data || err.message);
});
