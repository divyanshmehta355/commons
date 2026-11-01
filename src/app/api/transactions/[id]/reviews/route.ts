import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { dbService } from '@/lib/appwrite/tables';
import { createReviewSchema } from '@/lib/validation/schemas';
import { z } from 'zod';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const { id: transactionId } = await params;
    const transaction = await dbService.getTransactionById(transactionId);
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Must be a verified transaction participant
    if (transaction.ownerId !== user.id && transaction.borrowerId !== user.id) {
      return NextResponse.json({ error: 'Only participants of this transaction can leave a review.' }, { status: 403 });
    }

    // Must be in returned status (completed)
    if (transaction.status !== 'returned') {
      return NextResponse.json({ error: 'Reviews can only be submitted after the item has been returned.' }, { status: 400 });
    }

    // Check duplicate review
    const existing = await dbService.getReviewByTransactionAndReviewer(transactionId, user.id);
    if (existing) {
      return NextResponse.json({ error: 'You have already submitted a review for this transaction.' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = createReviewSchema.parse({
      ...body,
      transactionId: body?.transactionId || transactionId,
    });

    // Determine reviewee (if caller is owner, reviewee is borrower, and vice versa)
    const revieweeId = transaction.ownerId === user.id ? transaction.borrowerId : transaction.ownerId;

    const review = await dbService.createReview({
      transactionId,
      reviewerId: user.id,
      revieweeId,
      rating: parsed.rating,
      comment: parsed.comment || '',
      createdAt: new Date().toISOString(),
    });

    const request = await dbService.getBorrowRequestById(transaction.requestId);
    if (request) {
      await dbService.logActivity({
        communityId: request.communityId,
        actorId: user.id,
        entityType: 'review',
        entityId: review.$id,
        action: 'reviewed',
        metadata: JSON.stringify({ rating: parsed.rating }),
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ review, message: 'Review submitted successfully!' }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const message = err.issues.map((i) => i.message).join(', ') || 'Validation error';
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || 'Failed to submit review' }, { status: 400 });
  }
}

