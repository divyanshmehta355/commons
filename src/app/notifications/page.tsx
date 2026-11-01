'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@appwrite.io/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  Clock,
  Inbox,
  ArrowRight,
  Loader2,
  CheckCheck,
  Repeat,
  Star,
  AlertCircle
} from 'lucide-react';

interface NotificationItem {
  $id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      // error fetching
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const handleMarkAsRead = async (id: string, link?: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.$id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (link) {
        router.push(link);
      }
    } catch {
      if (link) router.push(link);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch {
      // error
    } finally {
      setMarkingAll(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'request_received':
        return <Inbox className="w-4 h-4 text-emerald-700" />;
      case 'request_approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-700" />;
      case 'request_rejected':
      case 'request_cancelled':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'handover_verified':
      case 'handover_completed':
        return <Repeat className="w-4 h-4 text-blue-600" />;
      case 'return_completed':
        return <Star className="w-4 h-4 text-amber-500 fill-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-stone-500" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-20 text-stone-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-3" />
          <p className="text-sm font-medium">Loading notifications...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold">
              <Bell className="w-3.5 h-3.5" />
              Activity Updates
            </div>
            <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
              Notifications {unreadCount > 0 && <span className="text-emerald-700">({unreadCount} new)</span>}
            </h1>
            <p className="text-stone-600 text-xs">
              Live updates on your borrow requests, handover codes, returns, and reviews.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs transition shadow-2xs self-start sm:self-center disabled:opacity-50"
            >
              {markingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />}
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-md mx-auto space-y-3 my-8">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">No notifications yet</h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
              When people request your items or approve your borrow requests, updates will appear right here.
            </p>
            <div className="pt-2">
              <Link
                href="/discover"
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition shadow-xs inline-flex items-center gap-1.5"
              >
                Explore Items
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.$id}
                onClick={() => handleMarkAsRead(n.$id, n.link)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
                  n.isRead
                    ? 'bg-white border-stone-200 hover:border-stone-300'
                    : 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300 shadow-2xs'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    n.isRead ? 'bg-stone-100' : 'bg-white shadow-2xs border border-emerald-100'
                  }`}
                >
                  {getNotificationIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-xs ${n.isRead ? 'font-semibold text-stone-900' : 'font-bold text-stone-900'}`}>
                      {n.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-stone-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-700" title="Unread" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {n.message}
                  </p>

                  {n.link && (
                    <div className="pt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                      <span>View details</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

