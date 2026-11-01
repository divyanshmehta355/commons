import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { createCommunitySchema } from '@/lib/validation/schemas';
import { dbService } from '@/lib/appwrite/tables';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q');

    const communities = await dbService.listCommunities();

    let filtered = communities.filter(c => c.status !== 'archived');
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        c => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      );
    }

    // Do not expose private join code hashes to clients
    const safeCommunities = filtered.map(c => ({
      ...c,
      joinCodeHash: undefined,
      hasJoinCode: !!c.joinCodeHash,
    }));

    return NextResponse.json({ communities: safeCommunities });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to list communities' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const body = await req.json();
    const parsed = createCommunitySchema.parse(body);

    // Generate slug from name
    const baseSlug = parsed.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    const community = await dbService.createCommunity({
      name: parsed.name,
      slug: uniqueSlug,
      description: parsed.description || '',
      visibility: parsed.visibility,
      city: parsed.city,
      region: parsed.region,
      joinCodeHash: parsed.joinCode ? parsed.joinCode.trim() : '',
      createdBy: user.id,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    // Automatically make creator an active Owner in members table
    await dbService.addMember({
      communityId: community.$id,
      userId: user.id,
      role: 'owner',
      status: 'active',
      displayName: user.name,
      joinedAt: new Date().toISOString(),
    });

    await dbService.logActivity({
      communityId: community.$id,
      actorId: user.id,
      entityType: 'community',
      entityId: community.$id,
      action: 'created',
      metadata: JSON.stringify({ name: community.name }),
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ community }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create community' }, { status: 400 });
  }
}

