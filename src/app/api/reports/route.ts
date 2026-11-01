import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { dbService } from '@/lib/appwrite/tables';
import { z } from 'zod';

const createReportSchema = z.object({
  resourceId: z.string().min(1, 'Resource ID is required'),
  reason: z.enum([
    'inappropriate',
    'unsafe',
    'damaged',
    'misleading',
    'other',
  ]),
  details: z.string().max(2000).optional().default(''),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const body = await req.json();
    const parsed = createReportSchema.parse(body);

    const resource = await dbService.getResourceById(parsed.resourceId);
    if (!resource || resource.status === 'archived') {
      return NextResponse.json({ error: 'Resource not found or already archived' }, { status: 404 });
    }

    if (resource.ownerId === user.id) {
      return NextResponse.json({ error: 'You cannot report your own resource' }, { status: 400 });
    }

    const report = await dbService.createResourceReport({
      reporterId: user.id,
      resourceId: resource.$id,
      communityId: resource.communityId,
      reason: parsed.reason,
      details: parsed.details || '',
      status: 'pending',
      resolvedBy: '',
      createdAt: new Date().toISOString(),
      resolvedAt: '',
    });

    await dbService.logActivity({
      communityId: resource.communityId,
      actorId: user.id,
      entityType: 'report',
      entityId: report.$id,
      action: 'resource_reported',
      metadata: JSON.stringify({ reason: parsed.reason, resourceTitle: resource.title }),
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      message: 'Report submitted successfully. Community moderators will review this listing.',
      report,
    }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || 'Validation error' }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Failed to submit report';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

