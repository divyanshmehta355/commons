import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser, checkCommunityMembership } from '@/lib/permissions/auth-guard';
import { createResourceSchema } from '@/lib/validation/schemas';
import { dbService } from '@/lib/appwrite/tables';
import { Query } from '@/lib/appwrite/server';
import { resolveApproximateLocation, fuzzCoordinates } from '@/lib/geo/spatial';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const communityId = searchParams.get('communityId');
    const ownerId = searchParams.get('ownerId');
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'available';

    const queries: string[] = [];
    if (communityId) queries.push(Query.equal('communityId', communityId));
    if (ownerId) queries.push(Query.equal('ownerId', ownerId));
    if (category) queries.push(Query.equal('category', category));
    if (status && status !== 'all') queries.push(Query.equal('status', status));

    const resources = await dbService.listResources(queries);
    return NextResponse.json({ resources });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to list resources' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const body = await req.json();
    const parsed = createResourceSchema.parse(body);

    // Verify caller is active member of community
    const membership = await checkCommunityMembership(user.id, parsed.communityId);
    if (!membership) {
      return NextResponse.json(
        { error: 'You must be an active member of this community to list resources.' },
        { status: 403 }
      );
    }

    // Resolve approximate fuzzed location for geo-spatial discovery
    const rawLoc = parsed.location || resolveApproximateLocation(parsed.pickupArea || '');
    const location = rawLoc ? fuzzCoordinates(rawLoc) : undefined;

    const resource = await dbService.createResource({
      communityId: parsed.communityId,
      ownerId: user.id,
      title: parsed.title,
      description: parsed.description || '',
      category: parsed.category,
      condition: parsed.condition,
      exchangeMode: parsed.exchangeMode,
      pricePerDay: parsed.pricePerDay || 0,
      currency: parsed.currency || 'INR',
      status: 'available',
      pickupArea: parsed.pickupArea || '',
      allowCrossCommunity: parsed.allowCrossCommunity ?? true,
      imageUrl: parsed.imageUrl || '',
      ...(location ? { location } : {}),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await dbService.logActivity({
      communityId: parsed.communityId,
      actorId: user.id,
      entityType: 'resource',
      entityId: resource.$id,
      action: 'listed',
      metadata: JSON.stringify({ title: resource.title, category: resource.category }),
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ resource }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create resource' }, { status: 400 });
  }
}

