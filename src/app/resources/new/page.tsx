'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@appwrite.io/react';
import { useRouter } from 'next/navigation';
import { ImageUpload } from '@/components/ui/ImageUpload';
import {
  Building2,
  Tag,
  MapPin,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Info
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

export default function NewResourcePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [communities, setCommunities] = useState<any[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);

  // Form fields
  const [communityId, setCommunityId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState<'new' | 'good' | 'fair'>('good');
  const [exchangeMode, setExchangeMode] = useState<'free' | 'rent' | 'exchange' | 'both'>('free');
  const [pricePerDay, setPricePerDay] = useState<number>(0);
  const [pickupArea, setPickupArea] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [allowCrossCommunity, setAllowCrossCommunity] = useState(true);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCommunities() {
      try {
        const res = await fetch('/api/communities');
        const data = await res.json();
        if (data.communities && data.communities.length > 0) {
          setCommunities(data.communities);
          setCommunityId(data.communities[0].$id);
        }
      } catch (err) {
        console.error('Failed to load communities:', err);
      } finally {
        setLoadingCommunities(false);
      }
    }
    loadCommunities();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth');
      return;
    }

    if (!communityId) {
      setError('Please select a community for this resource.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityId,
          title,
          description,
          category,
          condition,
          exchangeMode,
          pricePerDay: Number(pricePerDay) || 0,
          currency: 'INR',
          pickupArea,
          allowCrossCommunity,
          imageUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create resource listing.');
      } else {
        router.push(`/resources/${data.resource.$id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">List a Resource</h1>
          <p className="text-sm text-stone-600 mt-1">
            Share what you rarely use. Choose free lending, daily rental, or item exchange.
          </p>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-stone-200 shadow-xs space-y-6">
          {/* Community selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Target Community</label>
            {loadingCommunities ? (
              <div className="text-xs text-stone-400">Loading communities...</div>
            ) : communities.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                No communities found. Please <Link href="/communities/new" className="underline font-bold">create a community</Link> first!
              </div>
            ) : (
              <select
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              >
                {communities.map((c) => (
                  <option key={c.$id} value={c.$id}>
                    {c.name} ({c.city}, {c.region})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Item Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sony Alpha A6400 Mirrorless Camera"
              required
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
            />
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              >
                <option value="new">New / Mint</option>
                <option value="good">Good (Normal wear)</option>
                <option value="fair">Fair (Functional with marks)</option>
              </select>
            </div>
          </div>

          {/* Sharing Mode & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Sharing Mode</label>
              <select
                value={exchangeMode}
                onChange={(e) => setExchangeMode(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              >
                <option value="free">Free Lending (₹0)</option>
                <option value="rent">Paid Rental (Daily Quote)</option>
                <option value="both">Both (Free or Rent)</option>
                <option value="exchange">Item Exchange</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Daily Price (₹ INR) {exchangeMode === 'free' && '(Not applicable)'}
              </label>
              <input
                type="number"
                min={0}
                value={pricePerDay}
                onChange={(e) => setPricePerDay(Number(e.target.value))}
                disabled={exchangeMode === 'free' || exchangeMode === 'exchange'}
                placeholder="100"
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 disabled:bg-stone-50 disabled:text-stone-400"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Description & Usage Guidelines</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what is included, any quirks, and how you prefer borrowers to handle the item..."
              rows={4}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
            />
          </div>

          {/* Pickup Area & Image URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Approximate Pickup Area</label>
              <input
                type="text"
                value={pickupArea}
                onChange={(e) => setPickupArea(e.target.value)}
                placeholder="e.g. Near Campus Library / Block C"
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              />
              <p className="text-[10px] text-stone-400 mt-0.5">Never post your exact house or flat number.</p>
            </div>

            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              label="Resource Photo (optional)"
              helperText="Upload a photo of your item to Appwrite Storage, or paste a link."
            />
          </div>

          {/* Cross-community visibility */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="crossComm"
              checked={allowCrossCommunity}
              onChange={(e) => setAllowCrossCommunity(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="crossComm" className="text-xs text-stone-700">
              Allow members from nearby eligible communities to discover this item
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="pt-4 border-t border-stone-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Listing...</span>
                </>
              ) : (
                <>
                  <span>Publish to Community</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}

