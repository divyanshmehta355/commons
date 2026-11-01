import { Client, Users, TablesDB, ID, Query } from 'node-appwrite';

async function seed() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
  const apiKey = process.env.APPWRITE_API_KEY!;
  const dbId = process.env.APPWRITE_DATABASE_ID!;

  console.log('Seeding demo data into Commons TablesDB...');

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const users = new Users(client);
  const tablesDb = new TablesDB(client);

  // Helper to find or create user
  async function getOrCreateUser(email: string, name: string) {
    try {
      const list = await users.list([Query.equal('email', email)], 1);
      if (list.total > 0) {
        return list.users[0];
      }
    } catch {}

    const newId = ID.unique();
    return await users.create(newId, email, undefined, 'Password123!', name);
  }

  const alice = await getOrCreateUser('alice.fictional@commons.demo', 'Alice Chen');
  const bob = await getOrCreateUser('bob.fictional@commons.demo', 'Bob Martinez');
  const charlie = await getOrCreateUser('charlie.fictional@commons.demo', 'Charlie Patel');

  console.log(`✓ Demo users ready: Alice (${alice.$id}), Bob (${bob.$id}), Charlie (${charlie.$id})`);

  // Check or create primary community "Open Campus"
  let openCampusId = '';
  const existingComm = await tablesDb.listRows({
    databaseId: dbId,
    tableId: 'communities',
    queries: [Query.equal('slug', 'open-campus'), Query.limit(1)],
  });

  if (existingComm.total > 0) {
    openCampusId = existingComm.rows[0].$id;
    console.log(`✓ "Open Campus" community exists: ${openCampusId}`);
  } else {
    const c1 = await tablesDb.createRow({
      databaseId: dbId,
      tableId: 'communities',
      rowId: ID.unique(),
      data: {
        name: 'Open Campus',
        slug: 'open-campus',
        description: 'University student & faculty sharing hub for books, gear, electronics and sports equipment.',
        visibility: 'public',
        city: 'Bengaluru',
        region: 'Karnataka',
        joinCodeHash: '',
        createdBy: alice.$id,
        status: 'active',
        location: [77.6412, 12.9784],
        createdAt: new Date().toISOString(),
      },
    });
    openCampusId = c1.$id;
    console.log(`✓ Created community "Open Campus": ${openCampusId}`);
  }

  // Check or create second community "Maple Residency"
  let mapleId = '';
  const existingMaple = await tablesDb.listRows({
    databaseId: dbId,
    tableId: 'communities',
    queries: [Query.equal('slug', 'maple-residency'), Query.limit(1)],
  });

  if (existingMaple.total > 0) {
    mapleId = existingMaple.rows[0].$id;
  } else {
    const c2 = await tablesDb.createRow({
      databaseId: dbId,
      tableId: 'communities',
      rowId: ID.unique(),
      data: {
        name: 'Maple Residency',
        slug: 'maple-residency',
        description: 'Residential community for tool sharing, kitchenware, and weekend camping gear.',
        visibility: 'public',
        city: 'Bengaluru',
        region: 'Karnataka',
        joinCodeHash: '',
        createdBy: bob.$id,
        status: 'active',
        location: [77.6208, 12.9352],
        createdAt: new Date().toISOString(),
      },
    });
    mapleId = c2.$id;
  }

  // Ensure members exist
  async function ensureMember(communityId: string, userId: string, role: string, displayName: string) {
    const existing = await tablesDb.listRows({
      databaseId: dbId,
      tableId: 'members',
      queries: [Query.equal('communityId', communityId), Query.equal('userId', userId), Query.limit(1)],
    });
    if (existing.total === 0) {
      await tablesDb.createRow({
        databaseId: dbId,
        tableId: 'members',
        rowId: ID.unique(),
        data: {
          communityId,
          userId,
          role,
          status: 'active',
          displayName,
          joinedAt: new Date().toISOString(),
        },
      });
    }
  }

  await ensureMember(openCampusId, alice.$id, 'owner', 'Alice Chen');
  await ensureMember(openCampusId, bob.$id, 'member', 'Bob Martinez');
  await ensureMember(openCampusId, charlie.$id, 'member', 'Charlie Patel');
  await ensureMember(mapleId, bob.$id, 'owner', 'Bob Martinez');
  await ensureMember(mapleId, alice.$id, 'member', 'Alice Chen');

  console.log('✓ Memberships seeded');

  // Sample Resources
  const sampleResources = [
    {
      title: 'Canon EOS 1500D DSLR Camera',
      description: '24.1 MP DSLR with 18-55mm lens. Great for campus events and photo projects. Please handle with care!',
      category: 'Electronics',
      condition: 'good',
      exchangeMode: 'free',
      pricePerDay: 0,
      currency: 'INR',
      pickupArea: 'Library Quad / Block B',
      allowCrossCommunity: true,
      ownerId: alice.$id,
      communityId: openCampusId,
      imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Heavy Duty Aluminum Camera Tripod',
      description: 'Sturdy 65-inch tripod with 3-way pan head. Quick-release plate included.',
      category: 'Electronics',
      condition: 'new',
      exchangeMode: 'rent',
      pricePerDay: 75,
      currency: 'INR',
      pickupArea: 'Media Lab',
      allowCrossCommunity: true,
      ownerId: alice.$id,
      communityId: openCampusId,
      imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Casio FX-991EX Scientific Calculator',
      description: 'Advanced engineering calculator for mid-terms and finals. Fresh batteries inside.',
      category: 'Study materials',
      condition: 'good',
      exchangeMode: 'free',
      pricePerDay: 0,
      currency: 'INR',
      pickupArea: 'North Hostel Lounge',
      allowCrossCommunity: false,
      ownerId: charlie.$id,
      communityId: openCampusId,
      imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Introduction to Algorithms (CLRS 3rd Ed)',
      description: 'Standard textbook for CS algorithms course. Clear pages, no annotations.',
      category: 'Books',
      condition: 'good',
      exchangeMode: 'exchange',
      pricePerDay: 0,
      currency: 'INR',
      pickupArea: 'CS Dept Building',
      allowCrossCommunity: true,
      ownerId: bob.$id,
      communityId: openCampusId,
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Spalding Official Outdoor Basketball',
      description: 'Official size 7 basketball with good grip. Pump and needle included.',
      category: 'Sports equipment',
      condition: 'good',
      exchangeMode: 'free',
      pricePerDay: 0,
      currency: 'INR',
      pickupArea: 'Student Gym Court',
      allowCrossCommunity: true,
      ownerId: charlie.$id,
      communityId: openCampusId,
      imageUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Bosch 550W Impact Power Drill Kit',
      description: 'Complete drill set with masonry and wood drill bits. Perfect for DIY home setup.',
      category: 'Tools',
      condition: 'good',
      exchangeMode: 'rent',
      pricePerDay: 150,
      currency: 'INR',
      pickupArea: 'Maple Clubhouse',
      allowCrossCommunity: true,
      ownerId: bob.$id,
      communityId: mapleId,
      imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Full HD Portable Projector (3000 Lumens)',
      description: 'HDMI and wireless casting support. Great for movie nights or club presentations.',
      category: 'Electronics',
      condition: 'new',
      exchangeMode: 'both',
      pricePerDay: 250,
      currency: 'INR',
      pickupArea: 'Auditorium Annex',
      allowCrossCommunity: true,
      ownerId: alice.$id,
      communityId: openCampusId,
      imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Quechua 3-Person Waterproof Camping Tent',
      description: 'Quick pitch dome tent. Windproof and rain tested. Includes groundsheet and stakes.',
      category: 'Travel equipment',
      condition: 'good',
      exchangeMode: 'rent',
      pricePerDay: 200,
      currency: 'INR',
      pickupArea: 'Block 4 Parking',
      allowCrossCommunity: true,
      ownerId: bob.$id,
      communityId: mapleId,
      imageUrl: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: '15-Meter Heavy Duty Extension Cable Reel',
      description: '4-socket surge protected extension reel with reset switch. Ideal for outdoor events.',
      category: 'Event supplies',
      condition: 'good',
      exchangeMode: 'free',
      pricePerDay: 0,
      currency: 'INR',
      pickupArea: 'Open Grounds Pavilion',
      allowCrossCommunity: true,
      ownerId: charlie.$id,
      communityId: openCampusId,
      imageUrl: 'https://images.unsplash.com/photo-1558389186-438424b00a32?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const createdResourceIds: string[] = [];

  for (const item of sampleResources) {
    const existing = await tablesDb.listRows({
      databaseId: dbId,
      tableId: 'resources',
      queries: [Query.equal('title', item.title), Query.limit(1)],
    });
    if (existing.total === 0) {
      const res = await tablesDb.createRow({
        databaseId: dbId,
        tableId: 'resources',
        rowId: ID.unique(),
        data: {
          ...item,
          status: 'available',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      createdResourceIds.push(res.$id);
    } else {
      createdResourceIds.push(existing.rows[0].$id);
    }
  }

  console.log(`✓ Seeded ${sampleResources.length} fictional catalog resources.`);

  // Create an end-to-end completed demo cycle:
  // Alice's DSLR Camera borrowed by Bob and returned!
  const dslrId = createdResourceIds[0];
  const existingReqs = await tablesDb.listRows({
    databaseId: dbId,
    tableId: 'borrow_requests',
    queries: [Query.equal('resourceId', dslrId), Query.limit(1)],
  });

  if (existingReqs.total === 0) {
    const demoReq = await tablesDb.createRow({
      databaseId: dbId,
      tableId: 'borrow_requests',
      rowId: ID.unique(),
      data: {
        resourceId: dslrId,
        communityId: openCampusId,
        borrowerId: bob.$id,
        ownerId: alice.$id,
        startAt: '2026-10-15T10:00:00Z',
        endAt: '2026-10-18T18:00:00Z',
        exchangeMode: 'free',
        offeredResourceId: '',
        quotedTotal: 0,
        currency: 'INR',
        message: 'Hi Alice! Need the camera for the university annual science symposium.',
        status: 'completed',
        createdAt: '2026-10-14T09:00:00Z',
        updatedAt: '2026-10-18T19:00:00Z',
      },
    });

    const demoTx = await tablesDb.createRow({
      databaseId: dbId,
      tableId: 'transactions',
      rowId: ID.unique(),
      data: {
        requestId: demoReq.$id,
        resourceId: dslrId,
        ownerId: alice.$id,
        borrowerId: bob.$id,
        handoverAt: '2026-10-15T10:15:00Z',
        dueAt: '2026-10-18T18:00:00Z',
        returnedAt: '2026-10-18T18:30:00Z',
        status: 'returned',
        ownerConfirmed: true,
        borrowerConfirmed: true,
        createdAt: '2026-10-14T10:00:00Z',
      },
    });

    // Review from Bob to Alice
    await tablesDb.createRow({
      databaseId: dbId,
      tableId: 'reviews',
      rowId: ID.unique(),
      data: {
        transactionId: demoTx.$id,
        reviewerId: bob.$id,
        revieweeId: alice.$id,
        rating: 5,
        comment: 'Camera was in perfect condition and Alice was super helpful with the handover!',
        createdAt: '2026-10-18T20:00:00Z',
      },
    });

    // Activity log
    await tablesDb.createRow({
      databaseId: dbId,
      tableId: 'activity_logs',
      rowId: ID.unique(),
      data: {
        communityId: openCampusId,
        actorId: bob.$id,
        entityType: 'transaction',
        entityId: demoTx.$id,
        action: 'completed_share',
        metadata: JSON.stringify({ resource: 'Canon EOS 1500D DSLR Camera', savings: 1500 }),
        createdAt: '2026-10-18T18:30:00Z',
      },
    });

    console.log('✓ Seeded complete demo story: List → Discover → Request → Approve → Share → Return → Trust Review');
  }

  console.log('✓ All fictional demo data seeded successfully!');
}

seed().catch(console.error);

