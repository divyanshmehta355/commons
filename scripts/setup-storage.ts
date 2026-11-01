import { Client, Storage, Permission, Role } from 'node-appwrite';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local manually if not in process.env
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const apiKey = process.env.APPWRITE_API_KEY || '';
const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || 'resource-media';

async function setupStorage() {
  console.log('Connecting to Appwrite Storage at:', endpoint);
  console.log('Project ID:', projectId);
  console.log('Bucket ID:', bucketId);

  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

  const storage = new Storage(client);

  try {
    const existing = await storage.getBucket(bucketId);
    console.log(`✅ Bucket "${existing.name}" (${existing.$id}) already exists!`);
    return existing;
  } catch (err: any) {
    if (err.code === 404) {
      console.log(`Bucket "${bucketId}" not found. Creating it now...`);
      try {
        const bucket = await storage.createBucket(
          bucketId,
          'Resource Media',
          [
            Permission.read(Role.any()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users()),
          ],
          false, // fileSecurity: false allows bucket-level read("any")
          true,  // enabled
          10 * 1024 * 1024, // 10MB limit
          ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']
        );
        console.log(`🎉 Bucket "${bucket.name}" (${bucket.$id}) created successfully!`);
        return bucket;
      } catch (createErr: any) {
        console.error('❌ Failed to create bucket:', createErr.message || createErr);
        if (createErr.code === 401 || createErr.code === 403) {
          console.error(
            '⚠️ Make sure your Appwrite API Key has the following scopes:\n' +
            '   - buckets.read, buckets.write\n' +
            '   - files.read, files.write'
          );
        }
        throw createErr;
      }
    } else {
      console.error('Error checking bucket:', err.message || err);
      throw err;
    }
  }
}

setupStorage()
  .then(() => {
    console.log('Storage setup complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Storage setup failed:', err);
    process.exit(1);
  });
