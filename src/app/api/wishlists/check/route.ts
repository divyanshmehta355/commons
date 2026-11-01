import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/permissions/auth-guard';
import { dbService } from '@/lib/appwrite/tables';

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ saved: false, wishlistId: null });
  }

  const { searchParams } = new URL(req.url);
  const resourceId = searchParams.get('resourceId');
  if (!resourceId) {
    return NextResponse.json({ error: 'resourceId is required' }, { status: 400 });
  }

  try {
    const entry = await dbService.getWishlistEntry(user.id, resourceId);
    return NextResponse.json({
      saved: !!entry,
      wishlistId: entry?.$id || null,
    });
  } catch {
    return NextResponse.json({ saved: false, wishlistId: null });
  }
}

