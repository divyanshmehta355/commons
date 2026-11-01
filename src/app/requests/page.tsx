'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@appwrite.io/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Inbox,
  Send,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  AlertCircle,
  Loader2,
  Repeat
} from 'lucide-react';

export default function RequestsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'exchanges'>('incoming');
  const [requests, setRequests] = useState<any[]>([]);
  const [exchangeOffers, setExchangeOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchRequests = async (type: 'incoming' | 'outgoing') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/requests?type=${type}`);
      const data = await res.json();
      if (data.requests) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExchanges = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/exchange/offers');
      const data = await res.json();
      if (data.offers) {
        setExchangeOffers(data.offers);
      }
    } catch (err) {
      console.error('Failed to load exchanges:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
      return;
    }
    if (user) {
      if (activeTab === 'exchanges') {
        fetchExchanges();
      } else {
        fetchRequests(activeTab);
      }
    }
  }, [user, authLoading, activeTab]);

  const handleOfferResponse = async (offerId: string, action: 'accept' | 'decline' | 'cancel') => {
    setActionLoading(offerId);
    setNotification(null);
    try {
      const res = await fetch(`/api/exchange/offers/${offerId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotification({ type: 'error', message: data.error || 'Failed to update offer' });
      } else {
        setNotification({ type: 'success', message: data.message || `Offer successfully ${action}ed` });
        fetchExchanges();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error updating exchange offer' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    setNotification(null);
    try {
      const res = await fetch(`/api/requests/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setNotification({ type: 'error', message: data.error || 'Failed to approve' });
      } else {
        setNotification({ type: 'success', message: 'Request approved! Transaction created.' });
        fetchRequests('incoming');
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error approving request' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    setNotification(null);
    try {
      const res = await fetch(`/api/requests/${id}/reject`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setNotification({ type: 'error', message: data.error || 'Failed to reject' });
      } else {
        setNotification({ type: 'success', message: 'Request rejected.' });
        fetchRequests('incoming');
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error rejecting request' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    setActionLoading(id);
    setNotification(null);
    try {
      const res = await fetch(`/api/requests/${id}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setNotification({ type: 'error', message: data.error || 'Failed to cancel' });
      } else {
        setNotification({ type: 'success', message: 'Request cancelled.' });
        fetchRequests('outgoing');
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error cancelling request' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Requests Inbox</h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage incoming borrow requests from peers and track your outgoing bookings.
          </p>
        </div>

        {notification && (
          <div
            className={`p-4 rounded-xl mb-6 text-xs flex items-center gap-2 border ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <p className="font-medium">{notification.message}</p>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-stone-200/60 p-1 mb-8 max-w-lg">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'incoming'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Incoming ({activeTab === 'incoming' ? requests.length : '...'})
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'outgoing'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Send className="w-4 h-4" />
            Outgoing ({activeTab === 'outgoing' ? requests.length : '...'})
          </button>
          <button
            onClick={() => setActiveTab('exchanges')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'exchanges'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Repeat className="w-4 h-4" />
            Exchange Offers ({activeTab === 'exchanges' ? exchangeOffers.length : '...'})
          </button>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-stone-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-3" />
            <p className="text-sm font-medium">Loading...</p>
          </div>
        ) : activeTab === 'exchanges' ? (
          exchangeOffers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-4">
                <Repeat className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-1">No exchange offers yet</h3>
              <p className="text-xs text-stone-500 mb-6">
                When you or your neighbors propose item-for-item swaps, they will appear here.
              </p>
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition shadow-xs"
              >
                Browse Items
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {exchangeOffers.map((offer) => (
                <div
                  key={offer.$id}
                  className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs hover:border-stone-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider ${
                          offer.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : offer.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : offer.status === 'declined'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {offer.status}
                      </span>
                      <span className="text-stone-400">•</span>
                      <span className="text-xs font-semibold text-stone-500">
                        {offer.isProposer ? 'You proposed this exchange' : 'Incoming proposal for your item'}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex-1">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                          Offered Item
                        </span>
                        <Link
                          href={`/resources/${offer.offeredResourceId}`}
                          className="text-sm font-bold text-stone-900 hover:text-emerald-700 transition"
                        >
                          {offer.offeredResourceTitle}
                        </Link>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center self-center flex-shrink-0">
                        <Repeat className="w-4 h-4" />
                      </div>

                      <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex-1">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                          Target Item
                        </span>
                        <Link
                          href={`/resources/${offer.targetResourceId}`}
                          className="text-sm font-bold text-stone-900 hover:text-emerald-700 transition"
                        >
                          {offer.targetResourceTitle}
                        </Link>
                      </div>
                    </div>

                    {offer.message && (
                      <p className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-200 italic font-medium">
                        &ldquo;{offer.message}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap sm:flex-col items-stretch sm:items-end gap-2 flex-shrink-0">
                    {!offer.isProposer && offer.status === 'pending' && (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleOfferResponse(offer.$id, 'accept')}
                          disabled={actionLoading === offer.$id}
                          className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition shadow-xs flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          {actionLoading === offer.$id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Accept
                        </button>
                        <button
                          onClick={() => handleOfferResponse(offer.$id, 'decline')}
                          disabled={actionLoading === offer.$id}
                          className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {offer.isProposer && offer.status === 'pending' && (
                      <button
                        onClick={() => handleOfferResponse(offer.$id, 'cancel')}
                        disabled={actionLoading === offer.$id}
                        className="px-4 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition"
                      >
                        Cancel Proposal
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-1">
              No {activeTab} requests right now
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              {activeTab === 'incoming'
                ? 'When someone wants to borrow your listed items, their requests will appear here.'
                : 'You have not submitted any borrow requests yet.'}
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition shadow-xs"
            >
              Discover Items to Borrow
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.$id}
                className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs hover:border-stone-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {req.communityName}
                    </span>
                    <span className="text-stone-400">•</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : req.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-stone-900">
                    <Link href={`/resources/${req.resourceId}`} className="hover:text-emerald-700 transition">
                      {req.resourceTitle}
                    </Link>
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-700">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-stone-500" />
                      {req.startAt.slice(0, 10)} → {req.endAt.slice(0, 10)}
                    </span>
                    <span>
                      Mode: <strong className="text-stone-900 capitalize">{req.exchangeMode}</strong>
                    </span>
                    <span>
                      Quote: <strong className="text-emerald-700">₹{req.quotedTotal}</strong>
                    </span>
                  </div>

                  {req.message && (
                    <p className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-200 italic font-medium">
                      "{req.message}"
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap sm:flex-col items-stretch sm:items-end gap-2 flex-shrink-0">
                  {req.status === 'approved' || req.status === 'completed' ? (
                    <Link
                      href={`/requests/${req.$id}`}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition shadow-xs text-center inline-flex items-center justify-center gap-1.5"
                    >
                      <span>View Handover / Return</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : null}

                  {activeTab === 'incoming' && req.status === 'pending' && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleApprove(req.$id)}
                        disabled={actionLoading === req.$id}
                        className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition shadow-xs flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        {actionLoading === req.$id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(req.$id)}
                        disabled={actionLoading === req.$id}
                        className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {activeTab === 'outgoing' && req.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(req.$id)}
                      disabled={actionLoading === req.$id}
                      className="px-4 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition"
                    >
                      Cancel Request
                    </button>
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

