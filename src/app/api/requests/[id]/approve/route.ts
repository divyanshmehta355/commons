import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { dbService } from '@/lib/appwrite/tables';
import { checkBookingAvailability } from '@/lib/booking/conflict';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const { id } = await params;
    const request = await dbService.getBorrowRequestById(id);
    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Only owner can approve
    if (request.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only the resource owner can approve this request.' }, { status: 403 });
    }

    if (request.status !== 'pending') {
      return NextResponse.json({ error: `Cannot approve request with status "${request.status}".` }, { status: 400 });
    }

    // Recheck availability during approval
    const availCheck = await checkBookingAvailability(request.resourceId, request.startAt, request.endAt, request.$id);
    if (!availCheck.available) {
      return NextResponse.json(
        { error: availCheck.conflictReason || 'Resource is conflicting with an existing approved booking.' },
        { status: 409 }
      );
    }

    // Update request to approved
    const updatedRequest = await dbService.updateBorrowRequest(id, {
      status: 'approved',
      updatedAt: new Date().toISOString(),
    });

    // Create transaction in TablesDB
    const transaction = await dbService.createTransaction({
      requestId: request.$id,
      resourceId: request.resourceId,
      ownerId: request.ownerId,
      borrowerId: request.borrowerId,
      handoverAt: '',
      dueAt: request.endAt,
      returnedAt: '',
      status: 'awaiting_handover',
      ownerConfirmed: false,
      borrowerConfirmed: false,
      createdAt: new Date().toISOString(),
    });

    // Update resource status to reserved
    await dbService.updateResource(request.resourceId, {
      status: 'reserved',
      updatedAt: new Date().toISOString(),
    });

    await dbService.logActivity({
      communityId: request.communityId,
      actorId: user.id,
      entityType: 'request',
      entityId: request.$id,
      action: 'approved',
      metadata: JSON.stringify({ transactionId: transaction.$id }),
      createdAt: new Date().toISOString(),
    });

    // Notify borrower that their request is approved
    const resource = await dbService.getResourceById(request.resourceId);
    await dbService.createNotification({
      userId: request.borrowerId,
      title: 'Booking Approved!',
      message: `Your request for "${resource?.title || 'item'}" was approved by the owner. View handover instructions.`,
      type: 'request_approved',
      link: `/transactions/${transaction.$id}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      message: 'Request approved successfully',
      request: updatedRequest,
      transaction,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to approve request' }, { status: 400 });
  }
}

