import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { dbService } from '@/lib/appwrite/tables';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const { id } = await params;
    const transaction = await dbService.getTransactionById(id);
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.ownerId !== user.id && transaction.borrowerId !== user.id) {
      return NextResponse.json({ error: 'Only transaction participants can confirm return.' }, { status: 403 });
    }

    if (transaction.status !== 'borrowed' && transaction.status !== 'awaiting_handover') {
      return NextResponse.json({ error: `Cannot return transaction in "${transaction.status}" status.` }, { status: 400 });
    }

    const returnedAt = new Date().toISOString();

    const updated = await dbService.updateTransaction(id, {
      status: 'returned',
      returnedAt,
    });

    // Mark resource back to available
    await dbService.updateResource(transaction.resourceId, {
      status: 'available',
      updatedAt: new Date().toISOString(),
    });

    // Mark request as completed
    await dbService.updateBorrowRequest(transaction.requestId, {
      status: 'completed',
      updatedAt: new Date().toISOString(),
    });

    const request = await dbService.getBorrowRequestById(transaction.requestId);
    if (request) {
      await dbService.logActivity({
        communityId: request.communityId,
        actorId: user.id,
        entityType: 'transaction',
        entityId: transaction.$id,
        action: 'returned',
        metadata: JSON.stringify({ resourceId: transaction.resourceId }),
        createdAt: new Date().toISOString(),
      });
    }

    // Notify borrower and owner that item was returned & invite them to leave a review
    const resource = await dbService.getResourceById(transaction.resourceId);
    const partnerId = transaction.ownerId === user.id ? transaction.borrowerId : transaction.ownerId;
    await dbService.createNotification({
      userId: partnerId,
      title: 'Item Returned — Leave a Review',
      message: `Return confirmed for "${resource?.title || 'item'}". Please leave a review to build community trust!`,
      type: 'return_completed',
      link: `/transactions/${transaction.$id}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    // Notify any waiting members on the waitlist
    try {
      const waitlist = await dbService.listWaitlistByResource(transaction.resourceId);
      const waiting = waitlist.filter((w) => w.status === 'waiting');
      for (const w of waiting) {
        await dbService.createNotification({
          userId: w.userId,
          title: 'Item Available Now!',
          message: `Good news! "${resource?.title || 'An item you were waiting for'}" has been returned and is available to borrow.`,
          type: 'resource_available',
          link: `/resources/${transaction.resourceId}`,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
        await dbService.updateWaitlistEntry(w.$id, { status: 'notified' });
      }
    } catch (e) {
      console.error('Failed to notify waitlist members:', e);
    }

    return NextResponse.json({
      message: 'Item return confirmed! Transaction completed. You can now leave a trust review.',
      transaction: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Return confirmation failed' }, { status: 400 });
  }
}

