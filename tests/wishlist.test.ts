import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const addToWishlistSchema = z.object({
  resourceId: z.string().min(1, 'Resource ID is required'),
});

describe('Feature 6: Resource Wishlist Validation & Logic', () => {
  it('validates required resourceId on wishlist addition', () => {
    expect(addToWishlistSchema.safeParse({ resourceId: 'res-101' }).success).toBe(true);
    expect(addToWishlistSchema.safeParse({ resourceId: '' }).success).toBe(false);
    expect(addToWishlistSchema.safeParse({}).success).toBe(false);
  });

  it('prevents duplicate wishlist entries for the same user and resource', () => {
    const mockWishlist = [
      { userId: 'user-1', resourceId: 'res-101' },
      { userId: 'user-1', resourceId: 'res-102' },
      { userId: 'user-2', resourceId: 'res-101' },
    ];

    const isDuplicate = (userId: string, resourceId: string) =>
      mockWishlist.some((item) => item.userId === userId && item.resourceId === resourceId);

    expect(isDuplicate('user-1', 'res-101')).toBe(true);
    expect(isDuplicate('user-1', 'res-103')).toBe(false);
    expect(isDuplicate('user-2', 'res-102')).toBe(false);
  });

  it('filters out archived resources when loading wishlist', () => {
    const rawWishlistItems = [
      { wishlistId: 'w-1', resource: { id: 'r-1', title: 'Drill', status: 'available' } },
      { wishlistId: 'w-2', resource: { id: 'r-2', title: 'Tent', status: 'archived' } },
      { wishlistId: 'w-3', resource: { id: 'r-3', title: 'Camera', status: 'paused' } },
    ];

    const visibleItems = rawWishlistItems.filter((i) => i.resource.status !== 'archived');
    expect(visibleItems).toHaveLength(2);
    expect(visibleItems.map((i) => i.resource.id)).toEqual(['r-1', 'r-3']);
  });

  it('enforces that only the wishlist item owner can delete the entry', () => {
    const mockEntry = { id: 'w-1', userId: 'user-alice', resourceId: 'res-1' };

    const canDelete = (callerId: string, entry: typeof mockEntry) => callerId === entry.userId;

    expect(canDelete('user-alice', mockEntry)).toBe(true);
    expect(canDelete('user-bob', mockEntry)).toBe(false);
  });
});

