import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { updateResourceSchema } from '@/lib/validation/schemas';
import { dbService } from '@/lib/appwrite/tables';
import { resolveApproximateLocation, fuzzCoordinates } from '@/lib/geo/spatial';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resource = await dbService.getResourceById(id);
    if (!resource || resource.status === 'archived') {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const community = await dbService.getCommunityById(resource.communityId);

    return NextResponse.json({
      resource,
      community: community ? { id: community.$id, name: community.name, city: community.city } : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching resource' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const { id } = await params;
    const resource = await dbService.getResourceById(id);
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Only owner can edit
    if (resource.ownerId !== user.id) {
      return NextResponse.json({ error: 'You do not have permission to edit this resource.' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateResourceSchema.parse(body);

    let location = parsed.location;
    if (!location && parsed.pickupArea) {
      const resolved = resolveApproximateLocation(parsed.pickupArea);
      if (resolved) location = fuzzCoordinates(resolved);
    }

    const updated = await dbService.updateResource(id, {
      ...parsed,
      ...(location ? { location } : {}),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ resource: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update resource' }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const { id } = await params;
    const resource = await dbService.getResourceById(id);
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Must be owner or community admin
    const member = await dbService.getMember(resource.communityId, user.id);
    const isOwner = resource.ownerId === user.id;
    const isAdmin = member && (member.role === 'owner' || member.role === 'admin');

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied to delete this resource.' }, { status: 403 });
    }

    // Safety guard: cannot archive an item that is currently active with a borrower
    if (resource.status === 'borrowed') {
      return NextResponse.json(
        { error: 'Cannot remove an item that is currently borrowed. Please wait until the borrower returns it.' },
        { status: 400 }
      );
    }

    const updated = await dbService.updateResource(id, {
      status: 'archived',
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: 'Resource archived successfully', resource: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to archive resource' }, { status: 400 });
  }
}

