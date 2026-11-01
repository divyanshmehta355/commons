import { Client, Users, Databases } from 'node-appwrite';

async function main() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
  const apiKey = process.env.APPWRITE_API_KEY || '';

  console.log('Testing Appwrite Connection...');
  console.log('Endpoint:', endpoint);
  console.log('Project ID:', projectId ? `${projectId.slice(0, 4)}...${projectId.slice(-4)}` : '(none)');
  console.log('API Key configured:', !!apiKey);

  if (!projectId || !apiKey) {
    console.error('Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID or APPWRITE_API_KEY');
    process.exit(1);
  }

  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

  const users = new Users(client);
  const databases = new Databases(client);

  try {
    const userList = await users.list([], 1);
    console.log('✓ Successfully connected to Appwrite Auth! Total users:', userList.total);
  } catch (err: any) {
    console.error('✗ Appwrite Auth test failed:', err?.message || err);
  }

  try {
    const dbList = await databases.list();
    console.log('✓ Successfully connected to Appwrite Databases! Existing databases:', dbList.databases.map(d => d.name));
  } catch (err: any) {
    console.error('✗ Appwrite Databases test failed:', err?.message || err);
  }
}

main().catch(console.error);

