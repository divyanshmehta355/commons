import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { dbService } from '@/lib/appwrite/tables';
import { z } from 'zod';

const createExchangeOfferSchema = z.object({
  targetResourceId: z.string().min(1, 'Target resource ID is required'),
  offeredResourceId: z.string().min(1, 'Offered resource ID is required'),
  message: z.string().max(2000).optional().default(''),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const body = await req.json();
    const parsed = createExchangeOfferSchema.parse(body);

    if (parsed.targetResourceId === parsed.offeredResourceId) {
      return NextResponse.json({ error: 'Cannot exchange a resource for itself' }, { status: 400 });
    }

    const [targetResource, offeredResource] = await Promise.all([
      dbService.getResourceById(parsed.targetResourceId),
      dbService.getResourceById(parsed.offeredResourceId),
    ]);

    if (!targetResource || targetResource.status === 'archived') {
      return NextResponse.json({ error: 'Target resource not found or archived' }, { status: 404 });
    }

    if (!offeredResource || offeredResource.status === 'archived') {
      return NextResponse.json({ error: 'Offered resource not found or archived' }, { status: 404 });
    }

    if (targetResource.ownerId === user.id) {
      return NextResponse.json({ error: 'You cannot propose an exchange for your own resource' }, { status: 400 });
    }

    if (offeredResource.ownerId !== user.id) {
      return NextResponse.json({ error: 'You can only offer resources you own' }, { status: 403 });
    }

    if (targetResource.exchangeMode !== 'exchange' && targetResource.exchangeMode !== 'both') {
      return NextResponse.json({ error: 'Target resource does not accept exchange proposals' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const offer = await dbService.createExchangeOffer({
      proposerId: user.id,
      ownerId: targetResource.ownerId,
      targetResourceId: targetResource.$id,
      offeredResourceId: offeredResource.$id,
      communityId: targetResource.communityId,
      message: parsed.message || '',
      status: 'pending',
      createdAt: now,
      respondedAt: '',
    });

    // Notify owner
    await dbService.createNotification({
      userId: targetResource.ownerId,
      title: 'New Exchange Proposal',
      message: `Someone offered "${offeredResource.title}" in exchange for your "${targetResource.title}".`,
      type: 'request_received',
      link: '/requests',
      isRead: false,
      createdAt: now,
    });

    // Log activity
    await dbService.logActivity({
      communityId: targetResource.communityId,
      actorId: user.id,
      entityType: 'exchange',
      entityId: offer.$id,
      action: 'exchange_proposed',
      metadata: JSON.stringify({
        targetTitle: targetResource.title,
        offeredTitle: offeredResource.title,
      }),
      createdAt: now,
    });

    return NextResponse.json({
      message: 'Exchange proposal submitted successfully',
      offer,
    }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || 'Validation error' }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Failed to create exchange offer';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const rawOffers = await dbService.listExchangeOffersForUser(user.id);

    // Enrich with resource titles
    const enriched = await Promise.all(
      rawOffers.map(async (offer) => {
        const [target, offered] = await Promise.all([
          dbService.getResourceById(offer.targetResourceId).catch(() => null),
          dbService.getResourceById(offer.offeredResourceId).catch(() => null),
        ]);
        return {
          ...offer,
          targetResourceTitle: target?.title || 'Unknown Resource',
          targetResourceImage: target?.imageUrl || '',
          offeredResourceTitle: offered?.title || 'Unknown Resource',
          offeredResourceImage: offered?.imageUrl || '',
          isProposer: offer.proposerId === user.id,
        };
      })
    );

    return NextResponse.json({ offers: enriched });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch exchange offers';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

