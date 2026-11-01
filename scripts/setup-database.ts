import { Client, TablesDB, Permission, Role } from 'node-appwrite';

async function setup() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
  const apiKey = process.env.APPWRITE_API_KEY!;
  const dbId = process.env.APPWRITE_DATABASE_ID!;

  console.log(`Setting up Appwrite TablesDB for DB: ${dbId}`);

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const tablesDb = new TablesDB(client);

  const existing = await tablesDb.listTables(dbId);
  const existingTableIds = new Set(existing.tables.map(t => t.$id));
  console.log(`Found ${existingTableIds.size} existing tables.`);

  const tablesToCreate = [
    {
      id: 'communities',
      name: 'Communities',
      columns: [
        { type: 'string', key: 'name', size: 128, required: true },
        { type: 'string', key: 'slug', size: 128, required: true },
        { type: 'string', key: 'description', size: 2000, required: false, default: '' },
        { type: 'string', key: 'visibility', size: 32, required: true },
        { type: 'string', key: 'city', size: 128, required: true },
        { type: 'string', key: 'region', size: 128, required: true },
        { type: 'string', key: 'joinCodeHash', size: 256, required: false, default: '' },
        { type: 'string', key: 'createdBy', size: 128, required: true },
        { type: 'string', key: 'status', size: 32, required: true },
        { type: 'string', key: 'createdAt', size: 64, required: true },
        { type: 'point', key: 'location', required: false },
        { type: 'polygon', key: 'boundary', required: false },
      ]
    },
    {
      id: 'members',
      name: 'Members',
      columns: [
        { type: 'string', key: 'communityId', size: 64, required: true },
        { type: 'string', key: 'userId', size: 64, required: true },
        { type: 'string', key: 'role', size: 32, required: true },
        { type: 'string', key: 'status', size: 32, required: true },
        { type: 'string', key: 'displayName', size: 128, required: true },
        { type: 'string', key: 'joinedAt', size: 64, required: true },
      ]
    },
    {
      id: 'resources',
      name: 'Resources',
      columns: [
        { type: 'string', key: 'communityId', size: 64, required: true },
        { type: 'string', key: 'ownerId', size: 64, required: true },
        { type: 'string', key: 'title', size: 256, required: true },
        { type: 'string', key: 'description', size: 4000, required: false, default: '' },
        { type: 'string', key: 'category', size: 64, required: true },
        { type: 'string', key: 'condition', size: 32, required: true },
        { type: 'string', key: 'exchangeMode', size: 32, required: true },
        { type: 'float', key: 'pricePerDay', required: false, default: 0 },
        { type: 'string', key: 'currency', size: 16, required: false, default: 'INR' },
        { type: 'string', key: 'status', size: 32, required: true },
        { type: 'string', key: 'pickupArea', size: 256, required: false, default: '' },
        { type: 'boolean', key: 'allowCrossCommunity', required: false, default: true },
        { type: 'string', key: 'imageUrl', size: 2000, required: false, default: '' },
        { type: 'string', key: 'createdAt', size: 64, required: true },
        { type: 'string', key: 'updatedAt', size: 64, required: true },
        { type: 'point', key: 'location', required: false },
      ]
    },
    {
      id: 'resource_communities',
      name: 'Resource Communities',
      columns: [
        { type: 'string', key: 'resourceId', size: 64, required: true },
        { type: 'string', key: 'communityId', size: 64, required: true },
        { type: 'string', key: 'createdAt', size: 64, required: true },
      ]
    },
    {
      id: 'availability_rules',
      name: 'Availability Rules',
      columns: [
        { type: 'string', key: 'resourceId', size: 64, required: true },
        { type: 'string', key: 'startAt', size: 64, required: true },
        { type: 'string', key: 'endAt', size: 64, required: true },
        { type: 'string', key: 'ruleType', size: 32, required: true },
        { type: 'string', key: 'createdAt', size: 64, required: true },
      ]
    },
    {
      id: 'borrow_requests',
      name: 'Borrow Requests',
      columns: [
        { type: 'string', key: 'resourceId', size: 64, required: true },
        { type: 'string', key: 'communityId', size: 64, required: true },
        { type: 'string', key: 'borrowerId', size: 64, required: true },
        { type: 'string', key: 'ownerId', size: 64, required: true },
        { type: 'string', key: 'startAt', size: 64, required: true },
        { type: 'string', key: 'endAt', size: 64, required: true },
        { type: 'string', key: 'exchangeMode', size: 32, required: true },
        { type: 'string', key: 'offeredResourceId', size: 64, required: false, default: '' },
        { type: 'float', key: 'quotedTotal', required: false, default: 0 },
        { type: 'string', key: 'currency', size: 16, required: false, default: 'INR' },
        { type: 'string', key: 'message', size: 2000, required: false, default: '' },
        { type: 'string', key: 'status', size: 32, required: true },
        { type: 'string', key: 'createdAt', size: 64, required: true },
        { type: 'string', key: 'updatedAt', size: 64, required: true },
        { type: 'point', key: 'location', required: false },
      ]
    },
    {
      id: 'transactions',
      name: 'Transactions',
      columns: [
        { type: 'string', key: 'requestId', size: 64, required: true },
        { type: 'string', key: 'resourceId', size: 64, required: true },
        { type: 'string', key: 'ownerId', size: 64, required: true },
        { type: 'string', key: 'borrowerId', size: 64, required: true },
        { type: 'string', key: 'handoverAt', size: 64, required: false, default: '' },
        { type: 'string', key: 'dueAt', size: 64, required: true },
        { type: 'string', key: 'returnedAt', size: 64, required: false, default: '' },
        { type: 'string', key: 'status', size: 32, required: true },
        { type: 'boolean', key: 'ownerConfirmed', required: false, default: false },
        { type: 'boolean', key: 'borrowerConfirmed', required: false, default: false },
        { type: 'string', key: 'handoverTokenHash', size: 256, required: false, default: '' },
        { type: 'string', key: 'handoverExpiresAt', size: 64, required: false, default: '' },
        { type: 'string', key: 'createdAt', size: 64, required: true },
      ]
    },
    {
      id: 'wishlists',
      name: 'Wishlists',
      columns: [
        { type: 'string', key: 'userId', size: 64, required: true },
        { type: 'string', key: 'resourceId', size: 64, required: true },
        { type: 'string', key: 'createdAt', size: 64, required: true },
      ]
    },
    {
      id: 'notifications',
      name: 'Notifications',
      columns: [
        { type: 'string', key: 'userId', size: 64, required: true },
        { type: 'string', key: 'title', size: 128, required: true },
        { type: 'string', key: 'message', size: 1000, required: true },
        { type: 'string', key: 'type', size: 64, required: true },
        { type: 'string', key: 'link', size: 256, required: false, default: '' },
        { type: 'boolean', key: 'isRead', required: false, default: false },
        { type: 'string', key: 'createdAt', size: 64, required: true },
      ]
    },
    {
      id: 'resource_reports',
      name: 'Resource Reports',
      columns: [
        { type: 'string', key: 'reporterId', size: 64, required: true },
        { type: 'string', key: 'resourceId', size: 64, required: true },
        { type: 'string', key: 'communityId', size: 64, required: true },
        { type: 'string', key: 'reason', size: 64, required: true },
        { type: 'string', key: 'details', size: 2000, required: false, default: '' },
        { type: 'string', key: 'status', size: 32, required: true },
        { type: 'string', key: 'resolvedBy', size: 64, required: false, default: '' },
        { type: 'string', key: 'createdAt', size: 64, required: true },
        { type: 'string', key: 'resolvedAt', size: 64, required: false, default: '' },
      ]
    },
    {
      id: 'reviews',
      name: 'Reviews',
      columns: [
        { type: 'string', key: 'transactionId', size: 64, required: true },
        { type: 'string', key: 'reviewerId', size: 64, required: true },
        { type: 'string', key: 'revieweeId', size: 64, required: true },
        { type: 'integer', key: 'rating', required: true },
        { type: 'string', key: 'comment', size: 2000, required: false, default: '' },
        { type: 'string', key: 'createdAt', size: 64, required: true },
      ]
    },
    {
      id: 'activity_logs',
      name: 'Activity Logs',
      columns: [
        { type: 'string', key: 'communityId', size: 64, required: true },
        { type: 'string', key: 'actorId', size: 64, required: true },
        { type: 'string', key: 'entityType', size: 64, required: true },
        { type: 'string', key: 'entityId', size: 64, required: true },
        { type: 'string', key: 'action', size: 64, required: true },
        { type: 'string', key: 'metadata', size: 4000, required: false, default: '{}' },
        { type: 'string', key: 'createdAt', size: 64, required: true },
      ]
    },
    {
      id: 'ai_suggestions',
      name: 'AI Suggestions',
      columns: [
        { type: 'string', key: 'userId', size: 64, required: true },
        { type: 'string', key: 'communityId', size: 64, required: true },
        { type: 'string', key: 'suggestionType', size: 64, required: true },
        { type: 'string', key: 'inputSummary', size: 2000, required: false, default: '' },
        { type: 'string', key: 'result', size: 8000, required: false, default: '' },
        { type: 'string', key: 'status', size: 32, required: true },
        { type: 'string', key: 'createdAt', size: 64, required: true },
      ]
    },
    {
      id: 'exchange_offers',
      name: 'Exchange Offers',
      columns: [
        { type: 'string', key: 'proposerId', size: 64, required: true },
        { type: 'string', key: 'ownerId', size: 64, required: true },
        { type: 'string', key: 'targetResourceId', size: 64, required: true },
        { type: 'string', key: 'offeredResourceId', size: 64, required: true },
        { type: 'string', key: 'communityId', size: 64, required: true },
        { type: 'string', key: 'message', size: 2000, required: false, default: '' },
        { type: 'string', key: 'status', size: 32, required: true },
        { type: 'string', key: 'createdAt', size: 64, required: true },
        { type: 'string', key: 'respondedAt', size: 64, required: false, default: '' },
      ]
    },
    {
      id: 'waitlist_entries',
      name: 'Waitlist Entries',
      columns: [
        { type: 'string', key: 'userId', size: 64, required: true },
        { type: 'string', key: 'resourceId', size: 64, required: true },
        { type: 'string', key: 'communityId', size: 64, required: true },
        { type: 'string', key: 'status', size: 32, required: true },
        { type: 'string', key: 'createdAt', size: 64, required: true },
      ]
    },
    {
      id: 'resource_bundles',
      name: 'Resource Bundles',
      columns: [
        { type: 'string', key: 'communityId', size: 64, required: true },
        { type: 'string', key: 'creatorId', size: 64, required: true },
        { type: 'string', key: 'title', size: 128, required: true },
        { type: 'string', key: 'description', size: 2000, required: false, default: '' },
        { type: 'string', key: 'resourceIds', size: 2000, required: true },
        { type: 'string', key: 'status', size: 32, required: true },
        { type: 'string', key: 'createdAt', size: 64, required: true },
      ]
    },
    {
      id: 'community_challenges',
      name: 'Community Challenges',
      columns: [
        { type: 'string', key: 'communityId', size: 64, required: true },
        { type: 'string', key: 'title', size: 128, required: true },
        { type: 'string', key: 'description', size: 2000, required: false, default: '' },
        { type: 'integer', key: 'targetShares', required: true },
        { type: 'string', key: 'startDate', size: 64, required: true },
        { type: 'string', key: 'endDate', size: 64, required: true },
        { type: 'string', key: 'status', size: 32, required: true },
        { type: 'string', key: 'createdAt', size: 64, required: true },
      ]
    }
  ];

  for (const table of tablesToCreate) {
    if (!existingTableIds.has(table.id)) {
      console.log(`Creating table: ${table.name} (${table.id})...`);
      try {
        await tablesDb.createTable({
          databaseId: dbId,
          tableId: table.id,
          name: table.name,
          permissions: [
            Permission.read(Role.any()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users()),
          ]
        });
        console.log(`✓ Created table ${table.id}`);
      } catch (err: any) {
        console.error(`Error creating table ${table.id}:`, err?.message || err);
      }
    } else {
      console.log(`Table ${table.id} already exists.`);
    }

    // Now check columns
    let existingCols = new Set<string>();
    try {
      const cols = await tablesDb.listColumns(dbId, table.id);
      existingCols = new Set(cols.columns.map((c: any) => c.key));
    } catch (err) {
      // If table just created
    }

    for (const col of table.columns) {
      if (!existingCols.has(col.key)) {
        try {
          if (col.type === 'string') {
            await tablesDb.createStringColumn({
              databaseId: dbId,
              tableId: table.id,
              key: col.key,
              size: col.size,
              required: col.required,
              xdefault: col.default
            });
          } else if (col.type === 'integer') {
            await tablesDb.createIntegerColumn({
              databaseId: dbId,
              tableId: table.id,
              key: col.key,
              required: col.required,
              xdefault: col.default
            });
          } else if (col.type === 'float') {
            await tablesDb.createFloatColumn({
              databaseId: dbId,
              tableId: table.id,
              key: col.key,
              required: col.required,
              xdefault: col.default
            });
          } else if (col.type === 'boolean') {
            await tablesDb.createBooleanColumn({
              databaseId: dbId,
              tableId: table.id,
              key: col.key,
              required: col.required,
              xdefault: col.default
            });
          } else if (col.type === 'point') {
            await tablesDb.createPointColumn({
              databaseId: dbId,
              tableId: table.id,
              key: col.key,
              required: col.required,
              xdefault: col.default
            });
          } else if (col.type === 'polygon') {
            await tablesDb.createPolygonColumn({
              databaseId: dbId,
              tableId: table.id,
              key: col.key,
              required: col.required,
              xdefault: col.default
            });
          }
          console.log(`  + Added column ${col.key} to ${table.id}`);
        } catch (err: any) {
          console.error(`  x Failed to add column ${col.key} to ${table.id}:`, err?.message || err);
        }
      }
    }
  }

  console.log('✓ TablesDB schema setup complete!');
}

setup().catch(console.error);

