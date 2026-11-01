import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { dbService } from '@/lib/appwrite/tables';
import { z } from 'zod';

const updateMemberSchema = z.object({
  role: z.enum(['owner', 'admin', 'member']).optional(),
  status: z.enum(['pending', 'active', 'suspended']).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const { id: communityId, memberId } = await params;

    // Check caller's role in this community
    const callerMember = await dbService.getMember(communityId, user.id);
    if (!callerMember || (callerMember.role !== 'owner' && callerMember.role !== 'admin')) {
      return NextResponse.json({ error: 'Only owners or admins can manage community members.' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateMemberSchema.parse(body);

    // Prevent changing one's own role
    if (callerMember.$id === memberId && parsed.role && parsed.role !== callerMember.role) {
      return NextResponse.json({ error: 'You cannot change your own role.' }, { status: 400 });
    }

    const updated = await dbService.updateMember(memberId, parsed);
    return NextResponse.json({ member: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update member' }, { status: 400 });
  }
}

