import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { dbService } from '@/lib/appwrite/tables';
import { getAdminClient } from '@/lib/appwrite/server';

export async function PATCH(
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
      tableId: 'notifications',
      rowId: id,
    });

    if (!row || (row as any).userId !== user.id) {
      return NextResponse.json({ error: 'Notification not found or unauthorized' }, { status: 404 });
    }

    const updated = await dbService.markNotificationAsRead(id);
    return NextResponse.json({ notification: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update notification';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

