import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser, checkCommunityMembership } from '@/lib/permissions/auth-guard';
import { createBorrowRequestSchema } from '@/lib/validation/schemas';
import { dbService } from '@/lib/appwrite/tables';
import { checkBookingAvailability, calculateRentalDays, calculateQuotedPrice } from '@/lib/booking/conflict';
import { Query } from '@/lib/appwrite/server';

export async function GET(req: NextRequest) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all'; // 'incoming' | 'outgoing' | 'all'

    let requests = [];
    if (type === 'incoming') {
      requests = await dbService.listBorrowRequests([Query.equal('ownerId', user.id)]);
    } else if (type === 'outgoing') {
      requests = await dbService.listBorrowRequests([Query.equal('borrowerId', user.id)]);
    } else {
      const incoming = await dbService.listBorrowRequests([Query.equal('ownerId', user.id)]);
      const outgoing = await dbService.listBorrowRequests([Query.equal('borrowerId', user.id)]);
      requests = [...incoming, ...outgoing];
    }

    // Enrich with resource and community titles
    const enriched = await Promise.all(
      requests.map(async (r) => {
        const resource = await dbService.getResourceById(r.resourceId);
        const community = await dbService.getCommunityById(r.communityId);
        return {
          ...r,
          resourceTitle: resource?.title || 'Resource',
          resourceImage: resource?.imageUrl || '',
          communityName: community?.name || 'Community',
          isOwner: r.ownerId === user.id,
          isBorrower: r.borrowerId === user.id,
        };
      })
    );

    return NextResponse.json({ requests: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to list requests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const body = await req.json();
    const parsed = createBorrowRequestSchema.parse(body);

    const resource = await dbService.getResourceById(parsed.resourceId);
    if (!resource || resource.status === 'archived') {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    if (resource.ownerId === user.id) {
      return NextResponse.json({ error: 'You cannot request your own resource.' }, { status: 400 });
    }

    // Check community membership eligibility
    const membership = await checkCommunityMembership(user.id, resource.communityId);
    if (!membership) {
      return NextResponse.json(
        { error: 'You must join this community before borrowing resources from it.' },
        { status: 403 }
      );
    }

    // Check dates and conflicts
    const availCheck = await checkBookingAvailability(resource.$id, parsed.startAt, parsed.endAt);
    if (!availCheck.available) {
      return NextResponse.json(
        { error: availCheck.conflictReason || 'Resource is not available for requested dates.' },
        { status: 409 }
      );
    }

    // Server-side calculation of price
    const days = calculateRentalDays(parsed.startAt, parsed.endAt);
    const quotedTotal = calculateQuotedPrice(parsed.exchangeMode, resource.pricePerDay || 0, days);

    const request = await dbService.createBorrowRequest({
      resourceId: resource.$id,
      communityId: resource.communityId,
      borrowerId: user.id,
      ownerId: resource.ownerId,
      startAt: parsed.startAt,
      endAt: parsed.endAt,
      exchangeMode: parsed.exchangeMode,
      offeredResourceId: parsed.offeredResourceId || '',
      quotedTotal,
      currency: resource.currency || 'INR',
      message: parsed.message || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await dbService.logActivity({
      communityId: resource.communityId,
      actorId: user.id,
      entityType: 'request',
      entityId: request.$id,
      action: 'requested',
      metadata: JSON.stringify({ resourceTitle: resource.title, days, quotedTotal }),
      createdAt: new Date().toISOString(),
    });

    // Notify resource owner
    await dbService.createNotification({
      userId: resource.ownerId,
      title: 'New Borrow Request',
      message: `${user.name || 'A community member'} requested to borrow "${resource.title}".`,
      type: 'request_received',
      link: `/requests/${request.$id}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ request }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to submit borrow request' }, { status: 400 });
  }
}

