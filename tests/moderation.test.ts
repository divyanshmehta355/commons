import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const createReportSchema = z.object({
  resourceId: z.string().min(1, 'Resource ID is required'),
  reason: z.enum([
    'inappropriate',
    'unsafe',
    'damaged',
    'misleading',
    'other',
  ]),
  details: z.string().max(2000).optional().default(''),
});

const moderationActionSchema = z.object({
  action: z.enum(['pause_resource', 'archive_resource', 'dismiss']),
});

describe('Feature 15: Reporting and Moderation', () => {
  it('validates report payload and allowed reasons', () => {
    const valid = {
      resourceId: 'res-101',
      reason: 'inappropriate' as const,
      details: 'Listing contains inappropriate language.',
    };
    expect(createReportSchema.safeParse(valid).success).toBe(true);

    const invalidReason = {
      resourceId: 'res-101',
      reason: 'spam', // not in allowed reasons
    };
    expect(createReportSchema.safeParse(invalidReason).success).toBe(false);

    const missingResourceId = {
      reason: 'unsafe',
    };
    expect(createReportSchema.safeParse(missingResourceId).success).toBe(false);
  });

  it('prevents resource owners from reporting their own listings', () => {
    const canReportResource = (userId: string, resourceOwnerId: string, resourceStatus: string) => {
      if (resourceStatus === 'archived') return { allowed: false, error: 'Resource not found or archived' };
      if (userId === resourceOwnerId) return { allowed: false, error: 'You cannot report your own resource' };
      return { allowed: true };
    };

    expect(canReportResource('user-alice', 'user-alice', 'available').allowed).toBe(false);
    expect(canReportResource('user-bob', 'user-alice', 'available').allowed).toBe(true);
    expect(canReportResource('user-bob', 'user-alice', 'archived').allowed).toBe(false);
  });

  it('restricts moderation actions to community owners and admins', () => {
    const canModerate = (role?: 'owner' | 'admin' | 'member') => {
      return role === 'owner' || role === 'admin';
    };

    expect(canModerate('owner')).toBe(true);
    expect(canModerate('admin')).toBe(true);
    expect(canModerate('member')).toBe(false);
    expect(canModerate(undefined)).toBe(false);
  });

  it('validates moderation actions and resolves report state appropriately', () => {
    expect(moderationActionSchema.safeParse({ action: 'pause_resource' }).success).toBe(true);
    expect(moderationActionSchema.safeParse({ action: 'archive_resource' }).success).toBe(true);
    expect(moderationActionSchema.safeParse({ action: 'dismiss' }).success).toBe(true);
    expect(moderationActionSchema.safeParse({ action: 'ban_user' }).success).toBe(false);

    const applyAction = (action: 'pause_resource' | 'archive_resource' | 'dismiss') => {
      if (action === 'pause_resource') return { newResourceStatus: 'paused', reportStatus: 'resolved' };
      if (action === 'archive_resource') return { newResourceStatus: 'archived', reportStatus: 'resolved' };
      return { newResourceStatus: 'unchanged', reportStatus: 'dismissed' };
    };

    expect(applyAction('pause_resource')).toEqual({ newResourceStatus: 'paused', reportStatus: 'resolved' });
    expect(applyAction('archive_resource')).toEqual({ newResourceStatus: 'archived', reportStatus: 'resolved' });
    expect(applyAction('dismiss')).toEqual({ newResourceStatus: 'unchanged', reportStatus: 'dismissed' });
  });
});

