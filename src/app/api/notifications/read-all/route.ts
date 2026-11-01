import { NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { dbService } from '@/lib/appwrite/tables';

export async function POST() {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    await dbService.markAllNotificationsAsRead(user.id);
    return NextResponse.json({ message: 'All notifications marked as read' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to mark notifications as read';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

