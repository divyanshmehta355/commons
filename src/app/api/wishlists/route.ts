import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { dbService, ResourceDoc } from '@/lib/appwrite/tables';
import { z } from 'zod';

const addToWishlistSchema = z.object({
  resourceId: z.string().min(1, 'Resource ID is required'),
});

export async function GET() {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const wishlistEntries = await dbService.listWishlistsByUser(user.id);
    
    // Fetch resource details for each wishlist entry
    const items = await Promise.all(
      wishlistEntries.map(async (entry) => {
        try {
          const resource = await dbService.getResourceById(entry.resourceId);
          if (!resource || resource.status === 'archived') {
            return null;
          }
          return {
            wishlistId: entry.$id,
            savedAt: entry.createdAt,
            resource,
          };
        } catch {
          return null;
        }
      })
    );

    const validItems = items.filter(
      (item): item is { wishlistId: string; savedAt: string; resource: ResourceDoc } => item !== null
    );

    return NextResponse.json({ wishlist: validItems });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch wishlist';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const body = await req.json();
    const parsed = addToWishlistSchema.parse(body);

    const resource = await dbService.getResourceById(parsed.resourceId);
    if (!resource || resource.status === 'archived') {
      return NextResponse.json({ error: 'Resource not found or unavailable' }, { status: 404 });
    }

    // Prevent duplicate entries
    const existing = await dbService.getWishlistEntry(user.id, parsed.resourceId);
    if (existing) {
      return NextResponse.json(
        { wishlist: existing, message: 'Item is already in your wishlist' },
        { status: 200 }
      );
    }

    const entry = await dbService.addToWishlist(user.id, parsed.resourceId);
    return NextResponse.json({ wishlist: entry, message: 'Added to wishlist' }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || 'Validation error' }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Failed to add to wishlist';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

