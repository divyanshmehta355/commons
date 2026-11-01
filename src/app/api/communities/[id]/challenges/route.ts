import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { dbService } from '@/lib/appwrite/tables';
import { checkCommunityMembership } from '@/lib/permissions/auth-guard';
import { Query } from '@/lib/appwrite/server';
import { z } from 'zod';

const createChallengeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(128),
  description: z.string().max(2000).optional().default(''),
  targetShares: z.number().int().positive('Target shares must be a positive integer'),
  startDate: z.string().min(10, 'Valid start date is required'),
  endDate: z.string().min(10, 'Valid end date is required'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const { id: communityId } = await params;

    // Check membership and ensure caller is owner or admin
    const member = await checkCommunityMembership(user.id, communityId);
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return NextResponse.json({ error: 'Only community leaders (owner/admin) can create challenges' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createChallengeSchema.parse(body);

    if (new Date(parsed.endDate) <= new Date(parsed.startDate)) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const challenge = await dbService.createChallenge({
      communityId,
      title: parsed.title,
      description: parsed.description || '',
      targetShares: parsed.targetShares,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      status: 'active',
      createdAt: now,
    });

    await dbService.logActivity({
      communityId,
      actorId: user.id,
      entityType: 'challenge',
      entityId: challenge.$id,
      action: 'challenge_created',
      metadata: JSON.stringify({ title: challenge.title, targetShares: challenge.targetShares }),
      createdAt: now,
    });

    return NextResponse.json({
      message: 'Community challenge launched successfully!',
      challenge,
    }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || 'Validation error' }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Failed to create challenge';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const rawChallenges = await dbService.listChallengesByCommunity(communityId);

    // Fetch all completed requests in this community to compute real progress
    const completedRequests = await dbService.listBorrowRequests([
      Query.equal('communityId', communityId),
      Query.equal('status', 'completed'),
      Query.limit(200),
    ]);

    const now = new Date();

    const challenges = rawChallenges.map((ch) => {
      const start = new Date(ch.startDate);
      const end = new Date(ch.endDate);

      // Count completed requests within the challenge window
      const count = completedRequests.filter((req) => {
        const reqDate = new Date(req.updatedAt || req.createdAt);
        return reqDate >= start && reqDate <= end;
      }).length;

      const percent = Math.min(100, Math.round((count / ch.targetShares) * 100));
      const isPast = now > end;
      const isCompleted = count >= ch.targetShares;

      let computedStatus = ch.status;
      if (isCompleted) {
        computedStatus = 'completed';
      } else if (isPast) {
        computedStatus = 'expired';
      }

      const diffMs = end.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      return {
        ...ch,
        currentShares: count,
        percentComplete: percent,
        status: computedStatus,
        daysRemaining,
      };
    });

    return NextResponse.json({ challenges });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch challenges';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

