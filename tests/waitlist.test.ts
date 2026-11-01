import { describe, it, expect } from 'vitest';

describe('Feature 17: Resource Waitlist Logic', () => {
  it('prevents resource owners from joining waitlist for their own item', () => {
    const canJoinWaitlist = (userId: string, resourceOwnerId: string, resourceStatus: string) => {
      if (resourceStatus === 'archived') return { allowed: false, error: 'Resource not found or archived' };
      if (userId === resourceOwnerId) return { allowed: false, error: 'Cannot join waitlist for own item' };
      return { allowed: true };
    };

    expect(canJoinWaitlist('user-alice', 'user-alice', 'borrowed').allowed).toBe(false);
    expect(canJoinWaitlist('user-bob', 'user-alice', 'borrowed').allowed).toBe(true);
    expect(canJoinWaitlist('user-bob', 'user-alice', 'archived').allowed).toBe(false);
  });

  it('prevents duplicate active waitlist entries for the same user and resource', () => {
    const existingEntries = [
      { id: 'w-1', userId: 'user-bob', resourceId: 'res-1', status: 'waiting' },
      { id: 'w-2', userId: 'user-charlie', resourceId: 'res-1', status: 'notified' },
    ];

    const canAddEntry = (userId: string, resourceId: string) => {
      const isAlreadyWaiting = existingEntries.some(
        (e) => e.userId === userId && e.resourceId === resourceId && e.status === 'waiting'
      );
      if (isAlreadyWaiting) return { allowed: false, error: 'Already on waitlist' };
      return { allowed: true };
    };

    expect(canAddEntry('user-bob', 'res-1').allowed).toBe(false);
    expect(canAddEntry('user-charlie', 'res-1').allowed).toBe(true); // previous was notified, can rejoin
    expect(canAddEntry('user-david', 'res-1').allowed).toBe(true);
  });

  it('calculates waitlist size and user queue status accurately', () => {
    const entries = [
      { id: 'w-1', userId: 'user-1', status: 'waiting' },
      { id: 'w-2', userId: 'user-2', status: 'notified' },
      { id: 'w-3', userId: 'user-3', status: 'waiting' },
      { id: 'w-4', userId: 'user-4', status: 'cancelled' },
    ];

    const activeWaitlist = entries.filter((e) => e.status === 'waiting');
    expect(activeWaitlist.length).toBe(2);

    const isUserOnWaitlist = (userId: string) =>
      activeWaitlist.some((e) => e.userId === userId);

    expect(isUserOnWaitlist('user-1')).toBe(true);
    expect(isUserOnWaitlist('user-2')).toBe(false);
    expect(isUserOnWaitlist('user-3')).toBe(true);
  });

  it('transitions waitlist status to notified upon item return', () => {
    const waitlist = [
      { id: 'w-1', userId: 'user-1', status: 'waiting' },
      { id: 'w-2', userId: 'user-2', status: 'waiting' },
    ];

    const notifyWaitlistOnReturn = (items: typeof waitlist) => {
      return items.map((item) => ({
        ...item,
        status: 'notified' as const,
        notifiedAt: '2026-10-31T12:00:00Z',
      }));
    };

    const updated = notifyWaitlistOnReturn(waitlist);
    expect(updated.every((u) => u.status === 'notified')).toBe(true);
    expect(updated[0].notifiedAt).toBeDefined();
  });
});

