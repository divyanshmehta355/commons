import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { joinCommunitySchema } from '@/lib/validation/schemas';
import { dbService } from '@/lib/appwrite/tables';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const { id: communityId } = await params;
    const community = await dbService.getCommunityById(communityId);
    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    // Check if already a member
    const existing = await dbService.getMember(communityId, user.id);
    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json({ message: 'Already an active member', member: existing });
      }
      // If suspended or pending, return current status
      return NextResponse.json({ error: `Membership is currently ${existing.status}` }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = joinCommunitySchema.parse(body);

    if (community.visibility === 'private' && community.joinCodeHash) {
      if (!parsed.joinCode || parsed.joinCode.trim() !== community.joinCodeHash) {
        return NextResponse.json({ error: 'Invalid join code for this private community.' }, { status: 403 });
      }
    }

    const member = await dbService.addMember({
      communityId,
      userId: user.id,
      role: 'member',
      status: 'active',
      displayName: user.name,
      joinedAt: new Date().toISOString(),
    });

    await dbService.logActivity({
      communityId,
      actorId: user.id,
      entityType: 'member',
      entityId: member.$id,
      action: 'joined',
      metadata: JSON.stringify({ displayName: user.name }),
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ member, message: 'Successfully joined community' }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to join community' }, { status: 400 });
  }
}

