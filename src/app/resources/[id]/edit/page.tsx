'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@appwrite.io/react';
import { useRouter, useParams } from 'next/navigation';
import { ImageUpload } from '@/components/ui/ImageUpload';
import {
  Tag,
  MapPin,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Globe,
  Lock,
  Trash2,
} from 'lucide-react';

const CATEGORIES = [
  'Electronics',
  'Books',
  'Study materials',
  'Sports equipment',
  'Tools',
  'Furniture',
  'Kitchen appliances',
  'Clothing',
  'Travel equipment',
  'Event supplies',
  'Other',
];

export default function EditResourcePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const resourceId = params.id;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState<'new' | 'good' | 'fair'>('good');
  const [exchangeMode, setExchangeMode] = useState<'free' | 'rent' | 'exchange' | 'both'>('free');
  const [pricePerDay, setPricePerDay] = useState<number>(0);
  const [pickupArea, setPickupArea] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [allowCrossCommunity, setAllowCrossCommunity] = useState(true);
  const [status, setStatus] = useState<'available' | 'paused' | 'archived'>('available');

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function fetchResource() {
    try {
      const res = await fetch(`/api/resources/${resourceId}`);
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) { setNotFound(true); return; }
      const data = await res.json();
      const r = data.resource;

      // Only owner can edit
      if (r.ownerId !== user?.$id) {
        setForbidden(true);
        return;
      }

      setTitle(r.title);
      setDescription(r.description);
      setCategory(r.category);
      setCondition(r.condition);
      setExchangeMode(r.exchangeMode);
      setPricePerDay(r.pricePerDay ?? 0);
      setPickupArea(r.pickupArea ?? '');
      setImageUrl(r.imageUrl ?? '');
      setAllowCrossCommunity(r.allowCrossCommunity ?? true);
      setStatus(r.status === 'available' || r.status === 'paused' || r.status === 'archived' ? r.status : 'available');
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!resourceId || authLoading || !user) return;
    fetchResource();
  }, [resourceId, user, authLoading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/resources/${resourceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          condition,
          exchangeMode,
          pricePerDay: exchangeMode === 'rent' || exchangeMode === 'both' ? pricePerDay : 0,
          pickupArea: pickupArea.trim(),
          imageUrl: imageUrl.trim() || undefined,
          allowCrossCommunity,
          status,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to save changes.');
        return;
      }
      setSuccess(true);
      if (status === 'archived') {
        setTimeout(() => router.push('/dashboard'), 1200);
      } else {
        setTimeout(() => router.push(`/resources/${resourceId}`), 1200);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteResource() {
    if (!confirm('Are you sure you want to permanently remove this item from the community listing? It will no longer appear in discovery or be available to borrow.')) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/resources/${resourceId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to remove listing');
        setDeleting(false);
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('Network error while removing listing.');
      setDeleting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-stone-500">
          <AlertCircle className="w-10 h-10" />
          <p className="text-sm font-medium">Resource not found.</p>
          <button onClick={() => router.back()} className="text-xs text-emerald-700 underline">
            Go back
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-stone-500">
          <Lock className="w-10 h-10" />
          <p className="text-sm font-medium">You don't have permission to edit this resource.</p>
          <button onClick={() => router.back()} className="text-xs text-emerald-700 underline">
            Go back
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto px-4 py-10 w-full">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.push(`/resources/${resourceId}`)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to listing
          </button>
          <span className="text-stone-300">|</span>
          <h1 className="text-xl font-extrabold text-stone-900">Edit Resource</h1>
        </div>

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Saved! Redirecting…
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">Title *</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 resize-none"
            />
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                <Tag className="w-3.5 h-3.5 inline mr-1" />
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">Condition</label>
              <div className="flex gap-2">
                {(['new', 'good', 'fair'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCondition(c)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition capitalize ${
                      condition === c
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Exchange Mode */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-2">Exchange Mode</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['free', 'rent', 'exchange', 'both'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setExchangeMode(m)}
                  className={`py-2 rounded-xl text-xs font-semibold border-2 transition capitalize ${
                    exchangeMode === m
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            {(exchangeMode === 'rent' || exchangeMode === 'both') && (
              <div className="mt-3">
                <label className="text-xs font-semibold text-stone-700 block mb-1">Price per Day (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={pricePerDay}
                  onChange={(e) => setPricePerDay(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-2">Listing Status</label>
            <div className="grid grid-cols-3 gap-2">
              {(['available', 'paused', 'archived'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`py-2 rounded-xl text-xs font-semibold border-2 transition capitalize ${
                    status === s
                      ? s === 'available'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : s === 'paused'
                        ? 'border-amber-500 bg-amber-50 text-amber-800'
                        : 'border-stone-500 bg-stone-100 text-stone-700'
                      : 'border-stone-200 text-stone-500 hover:border-stone-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-stone-400 mt-1">
              Pausing hides the listing temporarily. Archiving removes it from discovery.
            </p>
          </div>

          {/* Pickup Area */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              <MapPin className="w-3.5 h-3.5 inline mr-1" />
              Pickup Area
            </label>
            <input
              value={pickupArea}
              onChange={(e) => setPickupArea(e.target.value)}
              placeholder="e.g. Block B lobby, Room 204"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>

          {/* Image Upload with Appwrite Bucket */}
          <ImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            label="Resource Photo (optional)"
            helperText="Upload a photo to Appwrite Storage, or paste an external image link."
          />

          {/* Cross-community */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={allowCrossCommunity}
              onChange={(e) => setAllowCrossCommunity(e.target.checked)}
              className="w-4 h-4 accent-emerald-700 rounded"
            />
            <div>
              <span className="text-sm font-semibold text-stone-800 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-emerald-700" />
                Allow cross-community discovery
              </span>
              <p className="text-[11px] text-stone-500">
                Let members of nearby communities find this resource.
              </p>
            </div>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || success}
            className="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : success ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {submitting ? 'Saving…' : success ? 'Saved!' : 'Save Changes'}
          </button>
        </form>

        {/* Danger Zone */}
        <div className="mt-8 bg-red-50/60 rounded-2xl border border-red-200 p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-red-900">Remove from Lending</h3>
              <p className="text-xs text-red-700 mt-0.5">
                Permanently archive this listing from the community catalog.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDeleteResource}
              disabled={deleting}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 flex-shrink-0"
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              {deleting ? 'Removing...' : 'Remove Listing'}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

