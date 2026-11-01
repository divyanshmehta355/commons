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

    if (request.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only the resource owner can reject this request.' }, { status: 403 });
    }

    if (request.status !== 'pending') {
      return NextResponse.json({ error: `Cannot reject request with status "${request.status}".` }, { status: 400 });
    }

    const updated = await dbService.updateBorrowRequest(id, {
      status: 'rejected',
      updatedAt: new Date().toISOString(),
    });

    await dbService.logActivity({
      communityId: request.communityId,
      actorId: user.id,
      entityType: 'request',
      entityId: request.$id,
      action: 'rejected',
      metadata: '{}',
      createdAt: new Date().toISOString(),
    });

    // Notify borrower that their request was rejected
    const resource = await dbService.getResourceById(request.resourceId);
    await dbService.createNotification({
      userId: request.borrowerId,
      title: 'Booking Request Declined',
      message: `Your request for "${resource?.title || 'item'}" was declined by the owner.`,
      type: 'request_rejected',
      link: `/requests/${request.$id}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: 'Request rejected', request: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to reject request' }, { status: 400 });
  }
}

