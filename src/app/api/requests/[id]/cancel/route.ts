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
    const request = await dbService.getBorrowRequestById(id);
    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (request.borrowerId !== user.id) {
      return NextResponse.json({ error: 'Only the borrower can cancel this request.' }, { status: 403 });
    }

    if (request.status !== 'pending') {
      return NextResponse.json({ error: `Cannot cancel request with status "${request.status}".` }, { status: 400 });
    }

    const updated = await dbService.updateBorrowRequest(id, {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });

    await dbService.logActivity({
      communityId: request.communityId,
      actorId: user.id,
      entityType: 'request',
      entityId: request.$id,
      action: 'cancelled',
      metadata: '{}',
      createdAt: new Date().toISOString(),
    });

    // Notify owner that borrower cancelled request
    const resource = await dbService.getResourceById(request.resourceId);
    await dbService.createNotification({
      userId: request.ownerId,
      title: 'Booking Request Cancelled',
      message: `The borrower cancelled their request for "${resource?.title || 'item'}".`,
      type: 'request_cancelled',
      link: `/requests/${request.$id}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: 'Request cancelled', request: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to cancel request' }, { status: 400 });
  }
}

