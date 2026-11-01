import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { dbService } from '@/lib/appwrite/tables';
import { z } from 'zod';

const moderationActionSchema = z.object({
  action: z.enum(['pause_resource', 'archive_resource', 'dismiss']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const { id: communityId, reportId } = await params;
    const member = await dbService.getMember(communityId, user.id);
    const isAdmin = member && (member.role === 'owner' || member.role === 'admin');

    if (!isAdmin) {
      return NextResponse.json({ error: 'Permission denied. Moderator access required.' }, { status: 403 });
    }

    const report = await dbService.getResourceReportById(reportId);
    if (!report || report.communityId !== communityId) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const body = await req.json();
    const { action } = moderationActionSchema.parse(body);

    const now = new Date().toISOString();

    if (action === 'pause_resource') {
      await dbService.updateResource(report.resourceId, {
        status: 'paused',
        updatedAt: now,
      });

      await dbService.updateResourceReport(reportId, {
        status: 'resolved',
        resolvedBy: user.id,
        resolvedAt: now,
      });

      await dbService.logActivity({
        communityId,
        actorId: user.id,
        entityType: 'report',
        entityId: reportId,
        action: 'report_resolved_resource_paused',
        metadata: JSON.stringify({ resourceId: report.resourceId }),
        createdAt: now,
      });

      return NextResponse.json({ message: 'Resource has been paused and report resolved.' });
    }

    if (action === 'archive_resource') {
      await dbService.updateResource(report.resourceId, {
        status: 'archived',
        updatedAt: now,
      });

      await dbService.updateResourceReport(reportId, {
        status: 'resolved',
        resolvedBy: user.id,
        resolvedAt: now,
      });

      await dbService.logActivity({
        communityId,
        actorId: user.id,
        entityType: 'report',
        entityId: reportId,
        action: 'report_resolved_resource_archived',
        metadata: JSON.stringify({ resourceId: report.resourceId }),
        createdAt: now,
      });

      return NextResponse.json({ message: 'Resource has been permanently archived from the community.' });
    }

    if (action === 'dismiss') {
      await dbService.updateResourceReport(reportId, {
        status: 'dismissed',
        resolvedBy: user.id,
        resolvedAt: now,
      });

      await dbService.logActivity({
        communityId,
        actorId: user.id,
        entityType: 'report',
        entityId: reportId,
        action: 'report_dismissed',
        metadata: JSON.stringify({ resourceId: report.resourceId }),
        createdAt: now,
      });

      return NextResponse.json({ message: 'Report dismissed without action.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || 'Validation error' }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Moderation action failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

