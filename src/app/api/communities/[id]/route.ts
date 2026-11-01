import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/appwrite/tables';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const community = await dbService.getCommunityById(id);
    if (!community || community.status === 'archived') {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    return NextResponse.json({
      community: {
        ...community,
        joinCodeHash: undefined,
        hasJoinCode: !!community.joinCodeHash,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching community' }, { status: 500 });
  }
}

