import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { dbService } from '@/lib/appwrite/tables';
import { getAdminClient } from '@/lib/appwrite/server';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const { id } = await params;
    const { tablesDb, databaseId } = getAdminClient();

    // Verify row exists and belongs to user
    const row = await tablesDb.getRow({
      databaseId,
      tableId: 'wishlists',
      rowId: id,
    });

    if (!row || (row as any).userId !== user.id) {
      return NextResponse.json({ error: 'Wishlist item not found or unauthorized' }, { status: 404 });
    }

    await dbService.removeFromWishlist(id);
    return NextResponse.json({ message: 'Removed from wishlist successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to remove from wishlist';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

