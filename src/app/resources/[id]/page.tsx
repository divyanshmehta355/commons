'use client';

import { useState, useEffect, use } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@appwrite.io/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Calendar,
  Clock,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  ArrowRight,
  UserCheck,
  Share2,
  Bookmark,
  Flag,
  Repeat,
  Users,
  BellRing
} from 'lucide-react';

export default function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [resource, setResource] = useState<any>(null);
  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking state
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 3);

  const [startAt, setStartAt] = useState(tomorrow.toISOString().slice(0, 10));
  const [endAt, setEndAt] = useState(dayAfter.toISOString().slice(0, 10));
  const [exchangeMode, setExchangeMode] = useState<'free' | 'rent' | 'exchange'>('free');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Availability & Quoted Calculation state
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [availResult, setAvailResult] = useState<any>(null);

  // Alternatives state
  const [alternatives, setAlternatives] = useState<any[]>([]);

  // Booked & blackout intervals for availability calendar
  const [bookedIntervals, setBookedIntervals] = useState<Array<{ id: string; startAt: string; endAt: string; type: string }>>([]);

  // Wishlist state
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistEntryId, setWishlistEntryId] = useState<string | null>(null);
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  // Report Modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<'inappropriate' | 'unsafe' | 'damaged' | 'misleading' | 'other'>('misleading');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Exchange Proposal Modal state
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [myResources, setMyResources] = useState<any[]>([]);
  const [selectedOfferedId, setSelectedOfferedId] = useState('');
  const [exchangeNote, setExchangeNote] = useState('');
  const [loadingMyResources, setLoadingMyResources] = useState(false);
  const [submittingExchange, setSubmittingExchange] = useState(false);
  const [exchangeSuccess, setExchangeSuccess] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  const openExchangeModal = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    setShowExchangeModal(true);
    setLoadingMyResources(true);
    setExchangeError(null);
    try {
      const res = await fetch('/api/exchange/my-resources');
      const data = await res.json();
      if (data.resources) {
        setMyResources(data.resources);
        if (data.resources.length > 0) {
          setSelectedOfferedId(data.resources[0].$id);
        }
      }
    } catch {
      setExchangeError('Failed to load your resources');
    } finally {
      setLoadingMyResources(false);
    }
  };

  const handleExchangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfferedId) {
      setExchangeError('Please select one of your items to offer in exchange');
      return;
    }
    setSubmittingExchange(true);
    setExchangeError(null);
    try {
      const res = await fetch('/api/exchange/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetResourceId: id,
          offeredResourceId: selectedOfferedId,
          message: exchangeNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setExchangeError(data.error || 'Failed to submit exchange proposal');
      } else {
        setExchangeSuccess(true);
        setTimeout(() => {
          setShowExchangeModal(false);
          setExchangeSuccess(false);
          setExchangeNote('');
        }, 1800);
      }
    } catch (err: any) {
      setExchangeError(err.message || 'Error submitting exchange');
    } finally {
      setSubmittingExchange(false);
    }
  };

  // Waitlist state
  const [onWaitlist, setOnWaitlist] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [togglingWaitlist, setTogglingWaitlist] = useState(false);

  const fetchWaitlist = async () => {
    try {
      const res = await fetch(`/api/resources/${id}/waitlist`);
      const data = await res.json();
      setOnWaitlist(Boolean(data.onWaitlist));
      setWaitlistCount(data.waitlistCount || 0);
    } catch {
      // ignore
    }
  };

  const handleWaitlistToggle = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    setTogglingWaitlist(true);
    try {
      const method = onWaitlist ? 'DELETE' : 'POST';
      const res = await fetch(`/api/resources/${id}/waitlist`, { method });
      if (res.ok) {
        setOnWaitlist(!onWaitlist);
        setWaitlistCount((prev) => (onWaitlist ? Math.max(0, prev - 1) : prev + 1));
      }
    } catch {
      // ignore
    } finally {
      setTogglingWaitlist(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth');
      return;
    }
    setSubmittingReport(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: id,
          reason: reportReason,
          details: reportDetails,
        }),
      });
      if (res.ok) {
        setReportSuccess(true);
        setTimeout(() => {
          setShowReportModal(false);
          setReportSuccess(false);
          setReportDetails('');
        }, 1800);
      }
    } catch {
      // ignore
    } finally {
      setSubmittingReport(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetch(`/api/wishlists/check?resourceId=${id}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.saved) {
          setIsWishlisted(true);
          setWishlistEntryId(d.wishlistId);
        }
      })
      .catch(() => {});
  }, [id, user]);

  const toggleWishlist = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    setTogglingWishlist(true);
    try {
      if (isWishlisted && wishlistEntryId) {
        const res = await fetch(`/api/wishlists/${wishlistEntryId}`, { method: 'DELETE' });
        if (res.ok) {
          setIsWishlisted(false);
          setWishlistEntryId(null);
        }
      } else {
        const res = await fetch('/api/wishlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resourceId: id }),
        });
        const data = await res.json();
        if (res.ok) {
          setIsWishlisted(true);
          setWishlistEntryId(data.wishlist?.$id || null);
        }
      }
    } catch {
      // ignore
    } finally {
      setTogglingWishlist(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/resources/${id}`);
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setResource(data.resource);
          setCommunity(data.community);
          if (data.resource.exchangeMode === 'rent') {
            setExchangeMode('rent');
          } else if (data.resource.exchangeMode === 'exchange') {
            setExchangeMode('exchange');
          } else {
            setExchangeMode('free');
          }

          // Fetch availability intervals
          fetch(`/api/resources/${id}/availability`)
            .then((r) => r.json())
            .then((avail) => {
              if (avail.bookedIntervals) setBookedIntervals(avail.bookedIntervals);
            })
            .catch(() => {});

          // Fetch waitlist status
          fetchWaitlist();

          // Fetch similar alternatives from TablesDB
          fetch('/api/resources/alternatives', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resourceId: data.resource.$id }),
          })
            .then((r) => r.json())
            .then((alt) => {
              if (alt.alternatives) setAlternatives(alt.alternatives);
            })
            .catch(() => {});
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load resource');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Check availability when dates change
  useEffect(() => {
    if (!resource || !startAt || !endAt) return;
    setCheckingAvail(true);
    setBookingError(null);

    fetch(`/api/resources/${id}/availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startAt: `${startAt}T09:00:00Z`,
        endAt: `${endAt}T18:00:00Z`,
        exchangeMode,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setAvailResult(data);
        if (!data.available) {
          setBookingError(data.conflictReason || 'Dates are not available');
        }
      })
      .catch(() => {})
      .finally(() => setCheckingAvail(false));
  }, [id, resource, startAt, endAt, exchangeMode]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth');
      return;
    }

    setSubmitting(true);
    setBookingError(null);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: resource.$id,
          startAt: `${startAt}T09:00:00Z`,
          endAt: `${endAt}T18:00:00Z`,
          exchangeMode,
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBookingError(data.error || 'Failed to submit request');
      } else {
        setBookingSuccess(true);
      }
    } catch (err: any) {
      setBookingError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-20 text-stone-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-3" />
          <p className="text-sm font-medium">Loading resource details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-stone-900 mb-2">Resource Unavailable</h2>
          <p className="text-stone-500 text-sm mb-6">{error || 'This listing may have been archived.'}</p>
          <Link href="/discover" className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-sm font-medium">
            Back to Discovery
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isOwner = user && user.$id === resource.ownerId;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-6">
          <Link href="/discover" className="hover:text-emerald-700">Discover</Link>
          <span>/</span>
          <span className="text-stone-800 font-medium">{resource.category}</span>
          <span>/</span>
          <span className="text-stone-600 font-semibold truncate max-w-xs">{resource.title}</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggleWishlist}
              disabled={togglingWishlist}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition shadow-xs ${
                isWishlisted
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
              title={isWishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-emerald-700 text-emerald-700' : 'text-stone-500'}`} />
              <span>{isWishlisted ? 'Saved' : 'Save'}</span>
            </button>

            {!isOwner && (
              <button
                onClick={() => setShowReportModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-600 hover:text-red-700 hover:border-red-200 hover:bg-red-50 transition shadow-xs"
                title="Report this listing"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report</span>
              </button>
            )}

            {isOwner && (
              <Link
                href={`/resources/${id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition shadow-xs"
              >
                Edit Listing
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main info (left 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Image */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs h-80 sm:h-96 relative">
              {resource.imageUrl ? (
                <img src={resource.imageUrl} alt={resource.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400">
                  <Tag className="w-16 h-16" />
                </div>
              )}
              <span className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-xs text-xs font-semibold text-stone-800 shadow-xs">
                {resource.category}
              </span>
              <span className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold shadow-xs">
                {resource.exchangeMode === 'free'
                  ? 'Free Lending'
                  : resource.exchangeMode === 'rent'
                  ? `₹${resource.pricePerDay} / day`
                  : resource.exchangeMode === 'both'
                  ? `Free or ₹${resource.pricePerDay}/day`
                  : 'Exchange Mode'}
              </span>
            </div>

            {/* Title & Community Info */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 mb-1">
                  <Building2 className="w-4 h-4" />
                  <span>{community?.name || 'Local Community'}</span>
                  {community?.city && <span className="text-stone-600 font-medium">• {community.city}</span>}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">{resource.title}</h1>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-700 pt-2 border-t border-stone-200">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-stone-900">Condition:</span>
                  <span className="capitalize px-2 py-0.5 rounded-md bg-stone-100 font-bold text-stone-800">{resource.condition}</span>
                </div>
                {resource.pickupArea && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-500" />
                    <span>Pickup Area: <strong className="text-stone-900 font-bold">{resource.pickupArea}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Status: <strong className="text-emerald-700 capitalize">{resource.status}</strong></span>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">Description & Notes</h2>
                <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">
                  {resource.description || 'No description provided.'}
                </p>
              </div>
            </div>

            {/* Alternatives section from TablesDB */}
            {alternatives.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                    Similar Community Items
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {alternatives.map((alt) => (
                    <Link
                      key={alt.$id}
                      href={`/resources/${alt.$id}`}
                      className="p-3 rounded-xl border border-stone-200 hover:border-emerald-600 hover:bg-stone-50/50 transition flex items-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                        {alt.imageUrl ? (
                          <img src={alt.imageUrl} alt={alt.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400">
                            <Tag className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-stone-900 truncate">{alt.title}</h4>
                        <p className="text-[11px] text-stone-500">
                          {alt.exchangeMode === 'free' ? 'Free' : `₹${alt.pricePerDay}/day`} • {alt.condition}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking sidebar (right 5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold text-stone-900 mb-1">Borrow this Resource</h2>
              <p className="text-xs text-stone-500 mb-6">
                Choose dates and submit a request to the owner.
              </p>

              {bookingSuccess ? (
                <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-100 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-stone-900">Request Sent!</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    The owner has been notified. You can track incoming status and chat in your requests inbox.
                  </p>
                  <Link
                    href="/requests"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-emerald-700 text-white font-medium text-xs hover:bg-emerald-800 transition shadow-xs"
                  >
                    View My Requests
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : isOwner ? (
                <div className="p-6 rounded-xl bg-stone-50 border border-stone-200 text-center space-y-3">
                  <UserCheck className="w-8 h-8 text-emerald-700 mx-auto" />
                  <h3 className="text-sm font-semibold text-stone-900">You are the Owner</h3>
                  <p className="text-xs text-stone-500">
                    {resource.status === 'paused'
                      ? 'This listing is paused and hidden from community discovery.'
                      : 'This is your active listing. You can manage incoming borrow requests or edit/remove it.'}
                  </p>
                  <div className="space-y-2 pt-1">
                    <Link
                      href="/requests"
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-emerald-700 text-white font-medium text-xs hover:bg-emerald-800 transition"
                    >
                      Manage Requests
                    </Link>
                    <Link
                      href={`/resources/${id}/edit`}
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-stone-200 bg-white text-stone-700 font-semibold text-xs hover:bg-stone-50 transition"
                    >
                      Edit or Remove Listing
                    </Link>
                  </div>

                  {/* Availability Schedule for Owner */}
                  <div className="text-left pt-3 border-t border-stone-200 space-y-2">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                      Bookings & Blackout Schedule
                    </span>
                    {bookedIntervals.length === 0 ? (
                      <p className="text-[11px] text-stone-500">No active bookings or blackout dates.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {bookedIntervals.map((interval) => (
                          <div
                            key={interval.id}
                            className="flex items-center justify-between text-[11px] px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-700"
                          >
                            <span>
                              {new Date(interval.startAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} –{' '}
                              {new Date(interval.endAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                interval.type === 'blackout'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {interval.type === 'blackout' ? 'Blackout' : 'Approved'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  {/* Sharing Mode (if resource allows both) */}
                  {resource.exchangeMode === 'both' && (
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Choose Mode</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setExchangeMode('free')}
                          className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition ${
                            exchangeMode === 'free'
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                              : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          Free Lending
                        </button>
                        <button
                          type="button"
                          onClick={() => setExchangeMode('rent')}
                          className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition ${
                            exchangeMode === 'rent'
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                              : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          Rental (₹{resource.pricePerDay}/day)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Date Pickers */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={startAt}
                        onChange={(e) => setStartAt(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Return Date</label>
                      <input
                        type="date"
                        value={endAt}
                        onChange={(e) => setEndAt(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  {/* Availability Schedule Indicator */}
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-900 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                        Availability Schedule
                      </span>
                      <span className="text-[10px] text-stone-500 font-medium">
                        {bookedIntervals.length === 0 ? 'No conflicts' : `${bookedIntervals.length} busy range(s)`}
                      </span>
                    </div>

                    {bookedIntervals.length === 0 ? (
                      <p className="text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        Fully open — select any dates to borrow
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                        {bookedIntervals.map((interval) => (
                          <div
                            key={interval.id}
                            className="flex items-center justify-between text-[11px] px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-700 shadow-2xs"
                          >
                            <span className="font-medium">
                              {new Date(interval.startAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} –{' '}
                              {new Date(interval.endAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                interval.type === 'blackout'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {interval.type === 'blackout' ? 'Blackout' : 'Booked'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message to owner */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Note to Owner (optional)</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Hi! I need this for..."
                      rows={3}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                    />
                  </div>

                  {/* Real-time Pricing Quote & Availability verification */}
                  {checkingAvail ? (
                    <div className="flex items-center gap-2 py-2 text-xs text-stone-500">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                      <span>Checking availability...</span>
                    </div>
                  ) : availResult?.available ? (
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5 text-xs">
                      <div className="flex justify-between text-stone-600">
                        <span>Duration:</span>
                        <span className="font-semibold text-stone-900">{availResult.days} day(s)</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Sharing Mode:</span>
                        <span className="font-semibold text-stone-900 capitalize">{exchangeMode}</span>
                      </div>
                      <div className="flex justify-between text-stone-900 pt-1.5 border-t border-stone-200 font-bold text-sm">
                        <span>Estimated Quote:</span>
                        <span className="text-emerald-700">
                          {availResult.quotedTotal > 0 ? `₹${availResult.quotedTotal}` : '₹0 (Free Share)'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 font-medium">
                        *Rental prices are informational community quotes. Settled offline upon handover.
                      </p>
                    </div>
                  ) : null}

                  {bookingError && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p className="leading-snug">{bookingError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || (availResult && !availResult.available)}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <>
                        <span>Request to Borrow</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <p className="text-xs text-center text-stone-600 font-medium">
                    You can cancel pending requests anytime until approved.
                  </p>

                  {/* Propose Item Exchange Button */}
                  {(resource.exchangeMode === 'exchange' || resource.exchangeMode === 'both') && (
                    <div className="pt-3 border-t border-stone-200">
                      <button
                        type="button"
                        onClick={openExchangeModal}
                        className="w-full py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-xs transition flex items-center justify-center gap-2"
                      >
                        <Repeat className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Propose Item Exchange</span>
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* Waitlist Section */}
            {!isOwner && (
              <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                      <BellRing className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">Resource Waitlist</h4>
                      <p className="text-[11px] text-stone-500">
                        {waitlistCount === 0
                          ? 'No one currently waiting'
                          : `${waitlistCount} neighbor${waitlistCount === 1 ? '' : 's'} in queue`}
                      </p>
                    </div>
                  </div>
                  {onWaitlist && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Joined
                    </span>
                  )}
                </div>

                <p className="text-xs text-stone-600">
                  {onWaitlist
                    ? "You're in line! We'll send an in-app alert the moment this item is returned."
                    : 'Need this item? Join the waitlist to receive an instant notification when it becomes available.'}
                </p>

                <button
                  type="button"
                  onClick={handleWaitlistToggle}
                  disabled={togglingWaitlist}
                  className={`w-full py-2.5 px-3 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
                    onWaitlist
                      ? 'border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                      : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs'
                  }`}
                >
                  {togglingWaitlist ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : onWaitlist ? (
                    <span>Leave Waitlist</span>
                  ) : (
                    <>
                      <BellRing className="w-3.5 h-3.5" />
                      <span>Join Waitlist</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Report Listing Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                    <Flag className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm">Report Listing</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="text-stone-400 hover:text-stone-600 text-sm font-bold p-1"
                >
                  ×
                </button>
              </div>

              {reportSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700 mx-auto" />
                  <p className="text-xs font-bold text-emerald-900">Report Submitted</p>
                  <p className="text-[11px] text-emerald-700">
                    Thank you. Community moderators have been notified and will review this item.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Reason for Report *
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                    >
                      <option value="misleading">Misleading or inaccurate description</option>
                      <option value="damaged">Item is severely damaged or unusable</option>
                      <option value="unsafe">Unsafe or hazardous product</option>
                      <option value="inappropriate">Inappropriate or prohibited item</option>
                      <option value="other">Other issue</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Details (optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Please share more context about the issue..."
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReportModal(false)}
                      className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReport}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-xs transition shadow-xs flex items-center gap-1.5"
                    >
                      {submittingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                      Submit Report
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
        {/* Exchange Proposal Modal */}
        {showExchangeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">Propose Item Exchange</h3>
                    <p className="text-[11px] text-stone-500">Offer one of your items to borrow &ldquo;{resource.title}&rdquo;</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExchangeModal(false)}
                  className="text-stone-400 hover:text-stone-600 text-sm font-bold p-1"
                >
                  ×
                </button>
              </div>

              {exchangeSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700 mx-auto" />
                  <p className="text-xs font-bold text-emerald-900">Exchange Proposal Sent!</p>
                  <p className="text-[11px] text-emerald-700">
                    The owner has been notified and can review your offer in their inbox.
                  </p>
                </div>
              ) : loadingMyResources ? (
                <div className="flex flex-col items-center justify-center p-8 text-stone-500">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-700 mb-2" />
                  <p className="text-xs">Loading your listings...</p>
                </div>
              ) : myResources.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center space-y-3">
                  <p className="text-xs font-semibold text-amber-900">No Active Listings to Offer</p>
                  <p className="text-[11px] text-amber-700">
                    You need to list at least one resource in the community before proposing an exchange.
                  </p>
                  <Link
                    href="/resources/new"
                    className="inline-block py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs"
                  >
                    List an Item Now
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleExchangeSubmit} className="space-y-4">
                  {exchangeError && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p className="leading-snug">{exchangeError}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Choose Your Item to Offer *
                    </label>
                    <select
                      value={selectedOfferedId}
                      onChange={(e) => setSelectedOfferedId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                    >
                      {myResources.map((item) => (
                        <option key={item.$id} value={item.$id}>
                          {item.title} ({item.category} • {item.condition})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Note to Owner (optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. I can lend you my drill set anytime next week while I use your ladder..."
                      value={exchangeNote}
                      onChange={(e) => setExchangeNote(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowExchangeModal(false)}
                      className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingExchange}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs transition shadow-xs flex items-center gap-1.5"
                    >
                      {submittingExchange ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Repeat className="w-3.5 h-3.5" />}
                      Send Proposal
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

