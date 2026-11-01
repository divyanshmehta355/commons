import { createNextServerHelpers } from '@appwrite.io/react/server/next';
import { Client, TablesDB, Users, Databases, Storage, Query, ID, Permission, Role } from 'node-appwrite';

export const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',
  apiKey: process.env.APPWRITE_API_KEY || '',
  databaseId: process.env.APPWRITE_DATABASE_ID || 'commons',
  bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || 'resource-media',
};

export function getNextServerHelpers() {
  return createNextServerHelpers({
    endpoint: appwriteConfig.endpoint,
    projectId: appwriteConfig.projectId,
    apiKey: appwriteConfig.apiKey,
    basePath: '/api/appwrite',
  });
}

export function getAdminClient() {
  const client = new Client();
  client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setKey(appwriteConfig.apiKey);

  const tablesDb = new TablesDB(client);
  const users = new Users(client);
  const databases = new Databases(client);
  const storage = new Storage(client);

  return {
    client,
    tablesDb,
    users,
    databases,
    storage,
    databaseId: appwriteConfig.databaseId,
    bucketId: appwriteConfig.bucketId,
  };
}

export { Query, ID, Storage, Permission, Role };

