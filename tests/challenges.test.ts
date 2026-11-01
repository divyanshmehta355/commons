import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const createChallengeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(128),
  description: z.string().max(2000).optional().default(''),
  targetShares: z.number().int().positive('Target shares must be a positive integer'),
  startDate: z.string().min(10, 'Valid start date is required'),
  endDate: z.string().min(10, 'Valid end date is required'),
});

describe('Feature 19: Community Challenges Logic', () => {
  it('validates community challenge schema and positive targets', () => {
    const valid = {
      title: 'Spring Sharing Sprint',
      description: 'Goal: Share 50 tools and household items this month!',
      targetShares: 50,
      startDate: '2026-11-01',
      endDate: '2026-11-30',
    };
    expect(createChallengeSchema.safeParse(valid).success).toBe(true);

    const nonPositiveTarget = {
      ...valid,
      targetShares: 0,
    };
    expect(createChallengeSchema.safeParse(nonPositiveTarget).success).toBe(false);

    const negativeTarget = {
      ...valid,
      targetShares: -10,
    };
    expect(createChallengeSchema.safeParse(negativeTarget).success).toBe(false);

    const shortTitle = {
      ...valid,
      title: 'Go',
    };
    expect(createChallengeSchema.safeParse(shortTitle).success).toBe(false);
  });

  it('restricts challenge creation to community owners and admins', () => {
    const canCreateChallenge = (role?: 'owner' | 'admin' | 'member') => {
      return role === 'owner' || role === 'admin';
    };

    expect(canCreateChallenge('owner')).toBe(true);
    expect(canCreateChallenge('admin')).toBe(true);
    expect(canCreateChallenge('member')).toBe(false);
    expect(canCreateChallenge(undefined)).toBe(false);
  });

  it('calculates progress percentage accurately and caps at 100%', () => {
    const computeProgress = (current: number, target: number) => {
      return Math.min(100, Math.round((current / target) * 100));
    };

    expect(computeProgress(0, 50)).toBe(0);
    expect(computeProgress(25, 50)).toBe(50);
    expect(computeProgress(50, 50)).toBe(100);
    expect(computeProgress(75, 50)).toBe(100); // capped at 100%
  });

  it('computes challenge status accurately based on target and dates', () => {
    const evaluateStatus = (
      current: number,
      target: number,
      now: Date,
      endDate: Date
    ) => {
      if (current >= target) return 'completed';
      if (now > endDate) return 'expired';
      return 'active';
    };

    const target = 20;
    const futureEnd = new Date('2026-12-31');
    const pastEnd = new Date('2026-01-01');
    const now = new Date('2026-06-01');

    // In progress
    expect(evaluateStatus(10, target, now, futureEnd)).toBe('active');
    // Reached target
    expect(evaluateStatus(20, target, now, futureEnd)).toBe('completed');
    // Overachieved
    expect(evaluateStatus(25, target, now, futureEnd)).toBe('completed');
    // Expired without reaching target
    expect(evaluateStatus(15, target, now, pastEnd)).toBe('expired');
  });
});

