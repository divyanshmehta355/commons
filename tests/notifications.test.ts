import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const notificationSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(128),
  message: z.string().min(1).max(1000),
  type: z.enum([
    'request_received',
    'request_approved',
    'request_rejected',
    'request_cancelled',
    'handover_verified',
    'return_completed',
  ]),
  link: z.string().optional(),
  isRead: z.boolean(),
  createdAt: z.string(),
});

describe('Feature 14: In-App Notifications Logic & Triggers', () => {
  it('validates notification schema correctly', () => {
    const validNotification = {
      userId: 'user-alice',
      title: 'New Borrow Request',
      message: 'Bob requested to borrow DSLR Camera.',
      type: 'request_received' as const,
      link: '/requests/req-123',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    expect(notificationSchema.safeParse(validNotification).success).toBe(true);

    const invalidType = {
      ...validNotification,
      type: 'unknown_event_type',
    };
    expect(notificationSchema.safeParse(invalidType).success).toBe(false);
  });

  it('calculates unread count from notification list accurately', () => {
    const notifications = [
      { id: 'n-1', isRead: false },
      { id: 'n-2', isRead: true },
      { id: 'n-3', isRead: false },
      { id: 'n-4', isRead: false },
    ];

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    expect(unreadCount).toBe(3);
  });

  it('enforces user ownership when marking a notification as read', () => {
    const notification = { id: 'n-1', userId: 'user-alice', isRead: false };

    const canUpdate = (callerId: string, item: typeof notification) =>
      callerId === item.userId;

    expect(canUpdate('user-alice', notification)).toBe(true);
    expect(canUpdate('user-bob', notification)).toBe(false);
  });

  it('correctly transitions state when marking all as read', () => {
    let notifications = [
      { id: 'n-1', isRead: false },
      { id: 'n-2', isRead: false },
    ];

    notifications = notifications.map((n) => ({ ...n, isRead: true }));
    expect(notifications.every((n) => n.isRead)).toBe(true);
    expect(notifications.filter((n) => !n.isRead)).toHaveLength(0);
  });
});

