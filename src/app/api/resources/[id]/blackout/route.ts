import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { dbService } from '@/lib/appwrite/tables';
import { z } from 'zod';

const createBlackoutSchema = z.object({
  startAt: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid start date required'),
  endAt: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid end date required'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const { id: resourceId } = await params;
    const resource = await dbService.getResourceById(resourceId);
    if (!resource || resource.status === 'archived') {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    if (resource.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only the resource owner can manage blackout dates.' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createBlackoutSchema.parse(body);

    const start = new Date(parsed.startAt).getTime();
    const end = new Date(parsed.endAt).getTime();
    if (end <= start) {
      return NextResponse.json({ error: 'End date must be after start date.' }, { status: 400 });
    }

    const rule = await dbService.createAvailabilityRule({
      resourceId,
      startAt: parsed.startAt,
      endAt: parsed.endAt,
      ruleType: 'blackout',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ rule, message: 'Blackout dates added successfully' }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || 'Validation error' }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Failed to add blackout rule';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const { id: resourceId } = await params;
    const resource = await dbService.getResourceById(resourceId);
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    if (resource.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only the resource owner can manage blackout dates.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const ruleId = searchParams.get('ruleId');
    if (!ruleId) {
      return NextResponse.json({ error: 'ruleId is required' }, { status: 400 });
    }

    await dbService.deleteAvailabilityRule(ruleId);
    return NextResponse.json({ message: 'Blackout rule removed successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to remove blackout rule';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

