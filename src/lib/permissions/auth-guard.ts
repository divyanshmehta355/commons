import { getNextServerHelpers } from '../appwrite/server';
import { dbService } from '../appwrite/tables';
import { NextResponse } from 'next/server';

export interface VerifiedUser {
  id: string;
  name: string;
  email: string;
}

export async function getAuthUser(): Promise<VerifiedUser | null> {
  try {
    const helpers = getNextServerHelpers();
    const user = await helpers.getLoggedInUser();
    if (!user || !user.$id) return null;
    return {
      id: user.$id,
      name: user.name || 'Member',
      email: user.email,
    };
  } catch {
    return null;
  }
}

export async function requireAuthUser(): Promise<{ user: VerifiedUser } | { errorResponse: NextResponse }> {
  const user = await getAuthUser();
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Unauthorized. Please sign in to perform this action.' },
        { status: 401 }
      ),
    };
  }
  return { user };
}

export async function checkCommunityMembership(userId: string, communityId: string) {
  const member = await dbService.getMember(communityId, userId);
  if (!member || member.status !== 'active') {
    return null;
  }
  return member;
}

