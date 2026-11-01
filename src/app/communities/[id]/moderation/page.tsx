'use client';

import { useState, useEffect, use } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@appwrite.io/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Pause,
  Trash2,
  XCircle,
  Clock,
  Shield,
  Tag
} from 'lucide-react';

interface ReportItem {
  $id: string;
  resourceId: string;
  reporterId: string;
  reason: string;
  details: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  resourceTitle: string;
  resourceStatus: string;
  resourceImageUrl?: string;
}

export default function ModerationQueuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: communityId } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  const loadQueue = async () => {
    try {
      const res = await fetch(`/api/communities/${communityId}/moderation`);
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const data = await res.json();
      if (data.reports) {
        setReports(data.reports);
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to load moderation queue' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && communityId) {
      loadQueue();
    }
  }, [user, communityId]);

  const handleAction = async (reportId: string, action: 'pause_resource' | 'archive_resource' | 'dismiss') => {
    setActionLoading(reportId);
    setNotification(null);
    try {
      const res = await fetch(`/api/communities/${communityId}/moderation/${reportId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotification({ type: 'error', message: data.error || 'Action failed' });
      } else {
        setNotification({ type: 'success', message: data.message });
        loadQueue();
      }
    } catch {
      setNotification({ type: 'error', message: 'Network error performing moderation action' });
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-20 text-stone-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-3" />
          <p className="text-sm font-medium">Verifying moderator permissions...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-stone-900">Access Restricted</h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            Only community owners and appointed admins can access the resource moderation queue.
          </p>
          <Link
            href={`/communities/${communityId}`}
            className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition"
          >
            Back to Community
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <Link href={`/communities/${communityId}`} className="hover:text-emerald-700 inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Community Hub
          </Link>
          <span>/</span>
          <span className="font-semibold text-stone-800">Moderation Queue</span>
        </div>

        {/* Page Header */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-800 text-xs font-semibold border border-red-200">
              <Shield className="w-3.5 h-3.5" />
              Community Safety & Compliance
            </div>
            <h1 className="text-2xl font-extrabold text-stone-900">Resource Moderation Queue</h1>
            <p className="text-xs text-stone-600">
              Review member reports on damaged, misleading, unsafe, or prohibited items.
            </p>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-red-50 text-red-900 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-700" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-stone-400 hover:text-stone-700 font-bold ml-4"
            >
              ×
            </button>
          </div>
        )}

        {/* Reports List */}
        {reports.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-stone-900">Moderation Queue Clear</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
              There are no pending reports for this community. All resource listings are in good standing!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => (
              <div
                key={r.$id}
                className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-red-100 text-red-800">
                        Reason: {r.reason}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          r.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : r.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        Status: {r.status}
                      </span>
                    </div>

                    <Link
                      href={`/resources/${r.resourceId}`}
                      className="text-base font-bold text-stone-900 hover:text-emerald-700 block transition mt-1"
                    >
                      {r.resourceTitle}
                    </Link>

                    <span className="text-[11px] text-stone-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Reported on {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {r.resourceImageUrl && (
                    <img
                      src={r.resourceImageUrl}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover border border-stone-100 flex-shrink-0"
                    />
                  )}
                </div>

                {r.details && (
                  <div className="p-3 bg-stone-50 rounded-xl text-xs text-stone-700 border border-stone-100 leading-relaxed">
                    <strong>Report Details:</strong> {r.details}
                  </div>
                )}

                {/* Moderator Actions */}
                {r.status === 'pending' && (
                  <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-end gap-2">
                    <button
                      onClick={() => handleAction(r.$id, 'dismiss')}
                      disabled={actionLoading === r.$id}
                      className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-semibold text-xs transition inline-flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5 text-stone-400" />
                      Dismiss
                    </button>

                    <button
                      onClick={() => handleAction(r.$id, 'pause_resource')}
                      disabled={actionLoading === r.$id}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Pause Listing
                    </button>

                    <button
                      onClick={() => handleAction(r.$id, 'archive_resource')}
                      disabled={actionLoading === r.$id}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Archive Listing
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

