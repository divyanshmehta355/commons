import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { dbService } from '@/lib/appwrite/tables';
import { checkCommunityMembership } from '@/lib/permissions/auth-guard';
import { z } from 'zod';

const createBundleSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(128),
  description: z.string().max(2000).optional().default(''),
  resourceIds: z.array(z.string().min(1)).min(2, 'A bundle must include at least 2 items'),
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

    // Check membership
    const member = await checkCommunityMembership(user.id, communityId);
    if (!member) {
      return NextResponse.json({ error: 'You must be a member of this community to create bundles' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createBundleSchema.parse(body);

    // Validate that all resources exist, belong to this community, and are active
    const resources = await Promise.all(
      parsed.resourceIds.map((rId) => dbService.getResourceById(rId))
    );

    for (let i = 0; i < resources.length; i++) {
      const res = resources[i];
      if (!res || res.status === 'archived') {
        return NextResponse.json({ error: `Resource "${parsed.resourceIds[i]}" not found or archived` }, { status: 400 });
      }
      if (res.communityId !== communityId) {
        return NextResponse.json({ error: `Resource "${res.title}" belongs to a different community` }, { status: 400 });
      }
    }

    const now = new Date().toISOString();
    const bundle = await dbService.createBundle({
      communityId,
      creatorId: user.id,
      title: parsed.title,
      description: parsed.description || '',
      resourceIds: JSON.stringify(parsed.resourceIds),
      status: 'active',
      createdAt: now,
    });

    await dbService.logActivity({
      communityId,
      actorId: user.id,
      entityType: 'bundle',
      entityId: bundle.$id,
      action: 'bundle_created',
      metadata: JSON.stringify({ title: bundle.title, itemCount: parsed.resourceIds.length }),
      createdAt: now,
    });

    return NextResponse.json({
      message: 'Resource bundle created successfully!',
      bundle,
    }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || 'Validation error' }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Failed to create bundle';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const rawBundles = await dbService.listBundlesByCommunity(communityId);

    // Enrich bundles with their constituent resources
    const enriched = await Promise.all(
      rawBundles.map(async (bundle) => {
        let itemIds: string[] = [];
        try {
          itemIds = JSON.parse(bundle.resourceIds);
        } catch {
          itemIds = [];
        }

        const items = await Promise.all(
          itemIds.map(async (rId) => {
            try {
              const res = await dbService.getResourceById(rId);
              return res && res.status !== 'archived' ? res : null;
            } catch {
              return null;
            }
          })
        );

        const validItems = items.filter((item): item is NonNullable<typeof item> => item !== null);
        const allAvailable = validItems.length > 0 && validItems.every((item) => item.status === 'available');

        return {
          ...bundle,
          items: validItems,
          itemCount: validItems.length,
          allAvailable,
        };
      })
    );

    return NextResponse.json({ bundles: enriched });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch bundles';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
