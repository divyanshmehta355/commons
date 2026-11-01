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
    const request = await dbService.getBorrowRequestById(id);
    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Only owner or borrower can view request details
    if (request.ownerId !== user.id && request.borrowerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to view this request' }, { status: 403 });
    }

    const resource = await dbService.getResourceById(request.resourceId);
    const community = await dbService.getCommunityById(request.communityId);
    const transaction = await dbService.getTransactionByRequestId(request.$id);

    return NextResponse.json({
      request,
      resource,
      community: community ? { id: community.$id, name: community.name, city: community.city } : null,
      transaction,
      isOwner: request.ownerId === user.id,
      isBorrower: request.borrowerId === user.id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching request' }, { status: 500 });
  }
}

