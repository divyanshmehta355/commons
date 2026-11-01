import { NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { dbService } from '@/lib/appwrite/tables';
import { Query } from '@/lib/appwrite/server';

export async function GET() {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const resources = await dbService.listResources([
      Query.equal('ownerId', user.id),
      Query.notEqual('status', 'archived'),
      Query.limit(50),
    ]);

    return NextResponse.json({ resources });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch user resources';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

