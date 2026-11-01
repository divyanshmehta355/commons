import { describe, it, expect } from 'vitest';
import {
  createCommunitySchema,
  createResourceSchema,
  createBorrowRequestSchema,
  createReviewSchema,
} from '../src/lib/validation/schemas';

describe('Validation Schemas & Permission Constraints', () => {
  it('validates community creation requirements', () => {
    const valid = {
      name: 'Eco Campus Hub',
      description: 'Campus sustainability network',
      visibility: 'public' as const,
      city: 'Delhi',
      region: 'NCR',
    };
    expect(createCommunitySchema.safeParse(valid).success).toBe(true);

    const invalid = {
      name: 'X', // too short
      visibility: 'unknown',
    };
    expect(createCommunitySchema.safeParse(invalid).success).toBe(false);
  });

  it('validates resource listing requirements', () => {
    const valid = {
      communityId: 'comm-123',
      title: 'Sony Wireless Headphones',
      description: 'Noise cancelling headphones for study sessions',
      category: 'Electronics' as const,
      condition: 'good' as const,
      exchangeMode: 'free' as const,
      pickupArea: 'Library reception',
    };
    expect(createResourceSchema.safeParse(valid).success).toBe(true);

    // Negative rental price should fail
    const invalidPrice = {
      ...valid,
      pricePerDay: -50,
    };
    expect(createResourceSchema.safeParse(invalidPrice).success).toBe(false);
  });

  it('validates borrow request date constraints', () => {
    const valid = {
      resourceId: 'res-456',
      startAt: '2026-11-01T10:00:00Z',
      endAt: '2026-11-05T10:00:00Z',
      exchangeMode: 'free' as const,
      message: 'Need this for the hackathon weekend',
    };
    expect(createBorrowRequestSchema.safeParse(valid).success).toBe(true);

    const invalidDate = {
      ...valid,
      startAt: 'not-a-date',
    };
    expect(createBorrowRequestSchema.safeParse(invalidDate).success).toBe(false);
  });

  it('validates review bounds (rating 1 to 5)', () => {
    expect(createReviewSchema.safeParse({
      transactionId: 'tx-789',
      rating: 5,
      comment: 'Great item, returned on time!',
    }).success).toBe(true);

    // Should succeed even without transactionId (inferred from route param)
    expect(createReviewSchema.safeParse({
      rating: 4,
      comment: 'Clean return',
    }).success).toBe(true);

    // Rating 0 should fail
    expect(createReviewSchema.safeParse({
      transactionId: 'tx-789',
      rating: 0,
    }).success).toBe(false);

    // Rating 6 should fail
    expect(createReviewSchema.safeParse({
      transactionId: 'tx-789',
      rating: 6,
    }).success).toBe(false);
  });
});

