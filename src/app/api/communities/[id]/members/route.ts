import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/appwrite/tables';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const members = await dbService.listMembers(communityId);
    return NextResponse.json({ members });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to list members' }, { status: 500 });
  }
}

