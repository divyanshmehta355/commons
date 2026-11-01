import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const createBundleSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(128),
  description: z.string().max(2000).optional().default(''),
  resourceIds: z.array(z.string().min(1)).min(2, 'A bundle must include at least 2 items'),
});

describe('Feature 18: Resource Bundles Logic', () => {
  it('validates bundle creation schema and requires at least 2 items', () => {
    const valid = {
      title: 'Camping Starter Kit',
      description: 'Tent, portable lantern, and sleeping bag.',
      resourceIds: ['res-tent-1', 'res-lantern-2', 'res-bag-3'],
    };
    expect(createBundleSchema.safeParse(valid).success).toBe(true);

    const singleItem = {
      title: 'Solo Item',
      resourceIds: ['res-tent-1'],
    };
    expect(createBundleSchema.safeParse(singleItem).success).toBe(false);

    const emptyTitle = {
      title: '',
      resourceIds: ['res-1', 'res-2'],
    };
    expect(createBundleSchema.safeParse(emptyTitle).success).toBe(false);
  });

  it('restricts bundle creation to community members', () => {
    const canCreateBundle = (isMember: boolean) => {
      if (!isMember) return { allowed: false, error: 'Must be a member of the community' };
      return { allowed: true };
    };

    expect(canCreateBundle(true).allowed).toBe(true);
    expect(canCreateBundle(false).allowed).toBe(false);
  });

  it('determines bundle availability only when all items are available', () => {
    const checkBundleAvailability = (items: Array<{ id: string; status: string }>) => {
      if (items.length === 0) return false;
      return items.every((i) => i.status === 'available');
    };

    const allAvailable = [
      { id: '1', status: 'available' },
      { id: '2', status: 'available' },
      { id: '3', status: 'available' },
    ];
    expect(checkBundleAvailability(allAvailable)).toBe(true);

    const oneBorrowed = [
      { id: '1', status: 'available' },
      { id: '2', status: 'borrowed' },
      { id: '3', status: 'available' },
    ];
    expect(checkBundleAvailability(oneBorrowed)).toBe(false);

    const oneReserved = [
      { id: '1', status: 'reserved' },
      { id: '2', status: 'available' },
    ];
    expect(checkBundleAvailability(oneReserved)).toBe(false);
  });
});

