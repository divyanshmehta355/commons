import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { dbService } from '@/lib/appwrite/tables';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resourceId } = await params;
    const auth = await requireAuthUser();
    const userId = !('errorResponse' in auth) ? auth.user.id : null;

    const entries = await dbService.listWaitlistByResource(resourceId);
    const waitingEntries = entries.filter((e) => e.status === 'waiting');

    const userEntry = userId ? waitingEntries.find((e) => e.userId === userId) : null;

    return NextResponse.json({
      waitlistCount: waitingEntries.length,
      onWaitlist: Boolean(userEntry),
      entryId: userEntry?.$id || null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch waitlist status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const { id: resourceId } = await params;
    const resource = await dbService.getResourceById(resourceId);

    if (!resource || resource.status === 'archived') {
      return NextResponse.json({ error: 'Resource not found or archived' }, { status: 404 });
    }

    if (resource.ownerId === user.id) {
      return NextResponse.json({ error: 'You cannot join the waitlist for your own item' }, { status: 400 });
    }

    const existing = await dbService.getWaitlistEntry(resourceId, user.id);
    if (existing) {
      return NextResponse.json({
        message: 'You are already on the waitlist for this item',
        entry: existing,
      });
    }

    const now = new Date().toISOString();
    const entry = await dbService.createWaitlistEntry({
      userId: user.id,
      resourceId,
      communityId: resource.communityId,
      status: 'waiting',
      createdAt: now,
    });

    await dbService.logActivity({
      communityId: resource.communityId,
      actorId: user.id,
      entityType: 'waitlist',
      entityId: entry.$id,
      action: 'waitlist_joined',
      metadata: JSON.stringify({ resourceTitle: resource.title }),
      createdAt: now,
    });

    return NextResponse.json({
      message: 'Successfully joined the waitlist! You will be notified when this item becomes available.',
      entry,
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to join waitlist';
    return NextResponse.json({ error: message }, { status: 400 });
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
    const { id: resourceId } = await params;
    const existing = await dbService.getWaitlistEntry(resourceId, user.id);

    if (!existing) {
      return NextResponse.json({ error: 'You are not on the waitlist for this item' }, { status: 404 });
    }

    await dbService.deleteWaitlistEntry(existing.$id);

    return NextResponse.json({
      message: 'You have left the waitlist for this item.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to leave waitlist';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

