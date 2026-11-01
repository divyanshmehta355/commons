import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { dbService } from '@/lib/appwrite/tables';

export async function GET(
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
      return NextResponse.json({ error: 'Unauthorized to view this transaction' }, { status: 403 });
    }

    const resource = await dbService.getResourceById(transaction.resourceId);
    const request = await dbService.getBorrowRequestById(transaction.requestId);
    const existingReview = await dbService.getReviewByTransactionAndReviewer(transaction.$id, user.id);

    return NextResponse.json({
      transaction,
      resource,
      request,
      isOwner: transaction.ownerId === user.id,
      isBorrower: transaction.borrowerId === user.id,
      hasReviewed: !!existingReview,
      userReview: existingReview,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching transaction' }, { status: 500 });
  }
}

