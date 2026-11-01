import { Client, TablesDB } from 'node-appwrite';

async function testTables() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
  const apiKey = process.env.APPWRITE_API_KEY!;
  const dbId = process.env.APPWRITE_DATABASE_ID!;

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const tablesDb = new TablesDB(client);

  try {
    const res = await tablesDb.listTables(dbId);
    console.log(`✓ TablesDB listTables succeeded! Total tables:`, res.total);
    for (const t of res.tables) {
      console.log(`  - ${t.$id} (${t.name})`);
    }
  } catch (err: any) {
    console.error(`✗ TablesDB listTables error:`, err.message);
  }
}

testTables().catch(console.error);
