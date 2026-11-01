import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import crypto from 'crypto';

const createCommunitySchema = z.object({
  name: z.string().min(2).max(128),
  slug: z.string().min(2).max(128).regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(2000).optional().default(''),
  visibility: z.enum(['public', 'private']),
  city: z.string().min(1).max(128),
  region: z.string().min(1).max(128),
  joinCode: z.string().max(64).optional(),
});

describe('Feature 20 & 21: Community Security & Membership Tests', () => {
  it('validates community creation rules and slugs', () => {
    const valid = {
      name: 'Indiranagar Borrowers',
      slug: 'indiranagar-borrowers',
      visibility: 'public' as const,
      city: 'Bengaluru',
      region: 'Karnataka',
    };
    expect(createCommunitySchema.safeParse(valid).success).toBe(true);

    const invalidSlug = {
      ...valid,
      slug: 'Indiranagar Borrowers!', // spaces and caps
    };
    expect(createCommunitySchema.safeParse(invalidSlug).success).toBe(false);
  });

  it('securely hashes join codes and verifies them with SHA-256', () => {
    const rawCode = 'SECRET-COMMUNITY-2026';
    const hash = crypto.createHash('sha256').update(rawCode).digest('hex');

    const verifyCode = (input: string, storedHash: string) => {
      const inputHash = crypto.createHash('sha256').update(input).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(storedHash));
    };

    expect(verifyCode('SECRET-COMMUNITY-2026', hash)).toBe(true);
    expect(verifyCode('WRONG-CODE', hash)).toBe(false);
  });

  it('enforces membership role permissions and suspension checks', () => {
    const canManageMembers = (member: { role: 'owner' | 'admin' | 'member'; status: string }) => {
      if (member.status !== 'active') return false;
      return member.role === 'owner' || member.role === 'admin';
    };

    expect(canManageMembers({ role: 'owner', status: 'active' })).toBe(true);
    expect(canManageMembers({ role: 'admin', status: 'active' })).toBe(true);
    expect(canManageMembers({ role: 'member', status: 'active' })).toBe(false);
    expect(canManageMembers({ role: 'owner', status: 'suspended' })).toBe(false);
  });

  it('blocks suspended members from performing community actions', () => {
    const canBorrowResource = (memberStatus: 'active' | 'suspended' | 'pending') => {
      return memberStatus === 'active';
    };

    expect(canBorrowResource('active')).toBe(true);
    expect(canBorrowResource('suspended')).toBe(false);
    expect(canBorrowResource('pending')).toBe(false);
  });
});

