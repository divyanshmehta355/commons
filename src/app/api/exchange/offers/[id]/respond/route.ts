import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { dbService } from '@/lib/appwrite/tables';
import { z } from 'zod';

const respondOfferSchema = z.object({
  action: z.enum(['accept', 'decline', 'cancel']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const { id: offerId } = await params;
    const offer = await dbService.getExchangeOfferById(offerId);

    if (!offer) {
      return NextResponse.json({ error: 'Exchange offer not found' }, { status: 404 });
    }

    if (offer.status !== 'pending') {
      return NextResponse.json({ error: `Offer is already ${offer.status}` }, { status: 400 });
    }

    const body = await req.json();
    const { action } = respondOfferSchema.parse(body);

    const isOwner = offer.ownerId === user.id;
    const isProposer = offer.proposerId === user.id;

    if (action === 'cancel') {
      if (!isProposer) {
        return NextResponse.json({ error: 'Only the proposer can cancel this exchange offer' }, { status: 403 });
      }
    } else {
      // accept or decline
      if (!isOwner) {
        return NextResponse.json({ error: 'Only the resource owner can accept or decline this offer' }, { status: 403 });
      }
    }

    const now = new Date().toISOString();
    let newStatus: 'accepted' | 'declined' | 'cancelled' = 'declined';
    if (action === 'accept') newStatus = 'accepted';
    if (action === 'cancel') newStatus = 'cancelled';

    const updated = await dbService.updateExchangeOffer(offerId, {
      status: newStatus,
      respondedAt: now,
    });

    // Notify the other party
    const targetUserId = isOwner ? offer.proposerId : offer.ownerId;
    const actionText = action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'cancelled';

    await dbService.createNotification({
      userId: targetUserId,
      title: `Exchange Offer ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
      message: `The exchange offer was ${actionText}.`,
      type: action === 'accept' ? 'request_approved' : 'request_rejected',
      link: '/requests',
      isRead: false,
      createdAt: now,
    });

    await dbService.logActivity({
      communityId: offer.communityId,
      actorId: user.id,
      entityType: 'exchange',
      entityId: offerId,
      action: `exchange_${actionText}`,
      metadata: JSON.stringify({ offerId, status: newStatus }),
      createdAt: now,
    });

    return NextResponse.json({
      message: `Exchange offer successfully ${actionText}`,
      offer: updated,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || 'Validation error' }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Failed to respond to exchange offer';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

