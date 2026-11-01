import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/appwrite/tables';
import { z } from 'zod';

const alternativesSchema = z.object({
  resourceId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resourceId } = alternativesSchema.parse(body);

    const target = await dbService.getResourceById(resourceId);
    if (!target) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Get real resources from TablesDB in the same category or community
    const allResources = await dbService.listResources();
    const alternatives = allResources
      .filter(r => r.$id !== target.$id && r.status === 'available')
      .filter(r => r.category === target.category || r.communityId === target.communityId)
      .slice(0, 4);

    return NextResponse.json({ alternatives, category: target.category });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to find alternatives' }, { status: 400 });
  }
}

