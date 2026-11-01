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
    const { id: communityId } = await params;
    const member = await dbService.getMember(communityId, user.id);
    const isAdmin = member && (member.role === 'owner' || member.role === 'admin');

    if (!isAdmin) {
      return NextResponse.json({ error: 'Permission denied. Community moderator access required.' }, { status: 403 });
    }

    const rawReports = await dbService.listReportsByCommunity(communityId);

    // Enrich reports with resource title & status
    const reports = await Promise.all(
      rawReports.map(async (r) => {
        try {
          const res = await dbService.getResourceById(r.resourceId);
          return {
            ...r,
            resourceTitle: res?.title || 'Unknown Item',
            resourceStatus: res?.status || 'unknown',
            resourceImageUrl: res?.imageUrl || '',
          };
        } catch {
          return {
            ...r,
            resourceTitle: 'Deleted Item',
            resourceStatus: 'archived',
            resourceImageUrl: '',
          };
        }
      })
    );

    return NextResponse.json({ reports });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch moderation queue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

