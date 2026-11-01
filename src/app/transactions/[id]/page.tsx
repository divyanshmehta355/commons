'use client';

import { useState, useEffect, use } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@appwrite.io/react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Star,
  Loader2,
  AlertCircle,
  Building2,
  Repeat,
  QrCode,
  KeyRound,
  Copy,
  Check
} from 'lucide-react';

export default function TransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Review state
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // QR Handover state
  const [handoverTokenData, setHandoverTokenData] = useState<{ token: string; qrDataUrl: string; expiresAt: string } | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);
  const [loadingToken, setLoadingToken] = useState(false);

  const fetchHandoverToken = async () => {
    setLoadingToken(true);
    try {
      const res = await fetch(`/api/transactions/${id}/handover`);
      const d = await res.json();
      if (d.token && d.qrDataUrl) {
        setHandoverTokenData(d);
      }
    } catch {
      // ignore
    } finally {
      setLoadingToken(false);
    }
  };

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setActionLoading(true);
    setNotification(null);
    try {
      const res = await fetch(`/api/transactions/${id}/handover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim() }),
      });
      const resData = await res.json();
      if (!res.ok) {
        setNotification({ type: 'error', message: resData.error || 'Failed to verify handover code' });
      } else {
        setNotification({ type: 'success', message: resData.message });
        setTokenInput('');
        loadData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification error';
      setNotification({ type: 'error', message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const res = await fetch(`/api/transactions/${id}`);
      const resData = await res.json();
      if (resData.error) {
        setNotification({ type: 'error', message: resData.error });
      } else {
        setData(resData);
        if (resData.transaction?.status === 'awaiting_handover') {
          fetchHandoverToken();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading transaction';
      setNotification({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleHandover = async () => {
    setActionLoading(true);
    setNotification(null);
    try {
      const res = await fetch(`/api/transactions/${id}/handover`, { method: 'POST' });
      const resData = await res.json();
      if (!res.ok) {
        setNotification({ type: 'error', message: resData.error || 'Failed to confirm handover' });
      } else {
        setNotification({ type: 'success', message: resData.message });
        loadData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Handover failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = async () => {
    setActionLoading(true);
    setNotification(null);
    try {
      const res = await fetch(`/api/transactions/${id}/return`, { method: 'POST' });
      const resData = await res.json();
      if (!res.ok) {
        setNotification({ type: 'error', message: resData.error || 'Failed to confirm return' });
      } else {
        setNotification({ type: 'success', message: resData.message });
        loadData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Return failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    setNotification(null);
    try {
      const res = await fetch(`/api/transactions/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: id, rating, comment: reviewComment }),
      });
      const resData = await res.json();
      if (!res.ok) {
        setNotification({ type: 'error', message: resData.error || 'Review submission failed' });
      } else {
        setNotification({ type: 'success', message: 'Review submitted successfully!' });
        loadData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error submitting review' });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-20 text-stone-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-3" />
          <p className="text-sm font-medium">Loading transaction details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!data || !data.transaction) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-stone-900 mb-2">Transaction Not Found</h2>
          <p className="text-stone-500 text-sm mb-6">You may not be an authorized participant.</p>
          <Link href="/requests" className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-sm font-medium">
            Back to Requests
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { transaction, resource, request, isOwner, isBorrower, hasReviewed, userReview } = data;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-6">
          <Link href="/requests" className="text-xs text-stone-500 hover:text-emerald-700 mb-2 inline-block">
            ← Back to Requests
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Transaction #{transaction.$id.slice(-6)}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                transaction.status === 'returned'
                  ? 'bg-emerald-100 text-emerald-800'
                  : transaction.status === 'borrowed'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {transaction.status.replace('_', ' ')}
            </span>
          </div>
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

        {/* Resource info card */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs mb-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">Shared Item</span>
              <h2 className="text-xl font-bold text-stone-900 mt-0.5">{resource?.title || 'Resource'}</h2>
              <p className="text-xs text-stone-600 font-medium mt-1">
                Your role: <strong className="text-stone-900 font-bold">{isOwner ? 'Owner' : 'Borrower'}</strong>
              </p>
            </div>
            {resource?.imageUrl && (
              <img src={resource.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-stone-100" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t border-stone-200">
            <div>
              <span className="text-stone-600 font-semibold block">Due Date</span>
              <span className="font-bold text-stone-900 text-sm">{transaction.dueAt.slice(0, 10)}</span>
            </div>
            <div>
              <span className="text-stone-600 font-semibold block">Quoted Price</span>
              <span className="font-bold text-emerald-700 text-sm">₹{request?.quotedTotal ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Handover & Return Actions */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs mb-6 space-y-4">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Sharing Lifecycle Execution</h3>

          {transaction.status === 'awaiting_handover' && (
            <div className="space-y-6">
              <p className="text-xs text-stone-600 leading-relaxed">
                Meet up at the agreed spot. The owner shows their single-use QR or verification code, and the borrower confirms receipt to activate the borrow period.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Left: QR Code & Verification Token Display */}
                <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col items-center text-center space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 uppercase tracking-wider">
                    <QrCode className="w-4 h-4 text-emerald-700" />
                    <span>Handover QR & Token</span>
                  </div>

                  {loadingToken ? (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
                    </div>
                  ) : handoverTokenData?.qrDataUrl ? (
                    <div className="space-y-2 flex flex-col items-center">
                      <div className="p-2 bg-white rounded-xl border border-stone-200 shadow-2xs">
                        <img
                          src={handoverTokenData.qrDataUrl}
                          alt="Handover QR Code"
                          className="w-44 h-44 rounded-lg object-contain"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-500 font-medium">Verification Code:</span>
                        <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-mono font-bold text-base tracking-widest border border-emerald-200">
                          {handoverTokenData.token}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (handoverTokenData?.token) {
                              navigator.clipboard.writeText(handoverTokenData.token);
                              setCopiedToken(true);
                              setTimeout(() => setCopiedToken(false), 2000);
                            }
                          }}
                          className="p-1.5 rounded-lg border border-stone-200 hover:bg-white text-stone-600 transition"
                          title="Copy token"
                        >
                          {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <span className="text-[10px] text-stone-400">
                        Single-use token • Expires in 24 hours
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={fetchHandoverToken}
                      className="text-xs text-emerald-700 underline font-semibold py-4"
                    >
                      Generate Handover Code
                    </button>
                  )}
                </div>

                {/* Right: Code Verification Form & Manual Confirmation */}
                <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 uppercase tracking-wider">
                      <KeyRound className="w-4 h-4 text-emerald-700" />
                      <span>Verify Handover</span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Entering the 6-character code cryptographically verifies the handover and immediately activates the borrowing record.
                    </p>

                    <form onSubmit={handleVerifyToken} className="space-y-2 pt-1">
                      <label className="text-[11px] font-semibold text-stone-700 block">
                        Enter 6-character code
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="e.g. 7A4B9C"
                          value={tokenInput}
                          onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                          className="px-3 py-2 rounded-xl border border-stone-200 bg-white font-mono font-bold text-sm tracking-wider w-full uppercase focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                        />
                        <button
                          type="submit"
                          disabled={actionLoading || tokenInput.length < 3}
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs transition shadow-xs flex-shrink-0"
                        >
                          {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Fallback button */}
                  <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                    <span className="text-[11px] text-stone-500">Manual fallback:</span>
                    <button
                      onClick={handleHandover}
                      disabled={actionLoading}
                      className="text-xs text-stone-600 hover:text-stone-900 font-semibold underline disabled:opacity-50"
                    >
                      Confirm without code
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {transaction.status === 'borrowed' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>The item is currently borrowed. Please return before <strong>{transaction.dueAt.slice(0, 10)}</strong>.</span>
              </div>
              <div>
                <button
                  onClick={handleReturn}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Repeat className="w-4 h-4" />}
                  Confirm Return Completed
                </button>
              </div>
            </div>
          )}

          {transaction.status === 'returned' && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
              <div>
                <p className="font-bold">Item safely returned!</p>
                <p className="text-[11px] text-emerald-600">The circular sharing cycle is complete.</p>
              </div>
            </div>
          )}
        </div>

        {/* Review Form (if returned) */}
        {transaction.status === 'returned' && (
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
              Community Trust Review
            </h3>
            {hasReviewed ? (
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 space-y-2">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: userReview?.rating || 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-stone-700 italic">"{userReview?.comment || 'No comment provided.'}"</p>
                <p className="text-[11px] text-emerald-700 font-medium">✓ Your review has been recorded!</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <p className="text-xs text-stone-500">
                  Rate your sharing experience with your peer to help build community reputation.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className={`p-1.5 rounded-lg transition ${
                          star <= rating ? 'text-amber-500' : 'text-stone-300 hover:text-stone-400'
                        }`}
                      >
                        <Star className={`w-6 h-6 ${star <= rating ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-stone-700 ml-2">{rating} of 5 Stars</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Review Comments</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Was the item in good shape? Was communication prompt?"
                    rows={3}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center gap-2"
                >
                  {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                  Submit Trust Review
                </button>
              </form>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

