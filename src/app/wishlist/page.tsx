'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@appwrite.io/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bookmark,
  Trash2,
  Tag,
  ArrowRight,
  Loader2,
  PackageOpen,
  MapPin,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface WishlistItem {
  wishlistId: string;
  savedAt: string;
  resource: {
    $id: string;
    title: string;
    description: string;
    category: string;
    condition: string;
    exchangeMode: string;
    pricePerDay: number;
    pickupArea?: string;
    imageUrl?: string;
    status: string;
  };
}

export default function WishlistPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  const loadWishlist = async () => {
    try {
      const res = await fetch('/api/wishlists');
      const data = await res.json();
      if (data.wishlist) {
        setItems(data.wishlist);
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to load your wishlist' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadWishlist();
    }
  }, [user]);

  const handleRemove = async (wishlistId: string) => {
    setRemovingId(wishlistId);
    try {
      const res = await fetch(`/api/wishlists/${wishlistId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.wishlistId !== wishlistId));
        setNotification({ type: 'success', message: 'Item removed from your wishlist' });
      } else {
        const d = await res.json();
        setNotification({ type: 'error', message: d.error || 'Failed to remove item' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Network error. Could not remove item' });
    } finally {
      setRemovingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-20 text-stone-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-3" />
          <p className="text-sm font-medium">Loading your saved items...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold">
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              Saved Collection
            </div>
            <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Your Wishlist</h1>
            <p className="text-stone-600 text-sm">
              Keep track of equipment, tools, and gear you want to borrow for upcoming projects.
            </p>
          </div>

          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition shadow-xs self-start sm:self-center"
          >
            Explore Catalog
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Notifications */}
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
              className="text-stone-400 hover:text-stone-700 text-sm font-bold ml-4"
            >
              ×
            </button>
          </div>
        )}

        {/* Wishlist Items Grid */}
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-lg mx-auto space-y-4 my-8">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <PackageOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">Your wishlist is empty</h3>
            <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
              When browsing community listings, click the bookmark icon on any item to save it for quick access later.
            </p>
            <div className="pt-2">
              <Link
                href="/discover"
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition shadow-xs inline-flex items-center gap-2"
              >
                Browse Available Items
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(({ wishlistId, resource }) => (
              <div
                key={wishlistId}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:border-stone-300 transition flex flex-col justify-between group"
              >
                <div>
                  {/* Image */}
                  <div className="h-48 bg-stone-100 relative overflow-hidden">
                    {resource.imageUrl ? (
                      <img
                        src={resource.imageUrl}
                        alt={resource.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <Tag className="w-10 h-10" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/95 text-[11px] font-semibold text-stone-800 shadow-xs">
                      {resource.category}
                    </span>
                    <span
                      className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shadow-xs ${
                        resource.status === 'available'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      {resource.status}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-2">
                    <h3 className="font-bold text-stone-900 text-base leading-snug truncate">
                      {resource.title}
                    </h3>
                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {resource.description || 'No description provided.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-3 text-xs text-stone-600 border-t border-stone-100">
                      <span className="font-medium">
                        Condition: <strong className="capitalize text-stone-900">{resource.condition}</strong>
                      </span>
                      <span>•</span>
                      <span className="font-medium text-emerald-800">
                        {resource.exchangeMode === 'free'
                          ? 'Free Lending'
                          : resource.exchangeMode === 'rent'
                          ? `₹${resource.pricePerDay}/day`
                          : resource.exchangeMode === 'both'
                          ? `Free or ₹${resource.pricePerDay}/day`
                          : 'Exchange'}
                      </span>
                      {resource.pickupArea && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-stone-600">
                            <MapPin className="w-3 h-3 text-stone-400" />
                            {resource.pickupArea}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleRemove(wishlistId)}
                    disabled={removingId === wishlistId}
                    className="p-2 rounded-xl text-stone-400 hover:text-red-700 hover:bg-red-50 transition border border-transparent hover:border-red-200"
                    title="Remove from wishlist"
                  >
                    {removingId === wishlistId ? (
                      <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>

                  <Link
                    href={`/resources/${resource.$id}`}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition shadow-xs inline-flex items-center gap-1.5"
                  >
                    View & Borrow
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
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

