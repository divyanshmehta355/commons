'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@appwrite.io/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  PlusCircle,
  TrendingUp,
  Package,
  Repeat,
  Users,
  Shield,
  Loader2,
  Tag,
  ArrowRight,
  Inbox
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [communities, setCommunities] = useState<any[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [userResources, setUserResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
      return;
    }

    async function loadData() {
      if (!user) return;
      try {
        const commRes = await fetch('/api/communities');
        const commData = await commRes.json();
        if (commData.communities && commData.communities.length > 0) {
          setCommunities(commData.communities);
          setSelectedCommunityId(commData.communities[0].$id);
        }

        // Fetch user's listings
        const resRes = await fetch(`/api/resources?ownerId=${user.$id}&status=all`);
        const resData = await resRes.json();
        if (resData.resources) {
          setUserResources(resData.resources);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadData();
    }
  }, [user, authLoading]);

  // When selected community changes, fetch analytics
  useEffect(() => {
    if (!selectedCommunityId) return;
    fetch(`/api/analytics/community/${selectedCommunityId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.metrics) setAnalytics(data);
      })
      .catch((err) => console.error('Failed to load analytics:', err));
  }, [selectedCommunityId]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-20 text-stone-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-3" />
          <p className="text-sm font-medium">Loading your dashboard...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Community Dashboard</h1>
            <p className="text-sm text-stone-600 mt-1">
              Welcome back, <strong>{user?.name || 'Member'}</strong>. Track community impact and listings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/resources/new"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4" />
              List Item
            </Link>

            <Link
              href="/communities/new"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition"
            >
              <Building2 className="w-4 h-4 text-emerald-700" />
              New Community
            </Link>
          </div>
        </div>

        {/* Community Selector & AI Summary */}
        {communities.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-700" />
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">Active Community:</span>
                <select
                  value={selectedCommunityId}
                  onChange={(e) => setSelectedCommunityId(e.target.value)}
                  className="px-3 py-1.5 text-sm font-bold text-stone-900 bg-white rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                >
                  {communities.map((c) => (
                    <option key={c.$id} value={c.$id}>
                      {c.name} ({c.city})
                    </option>
                  ))}
                </select>
              </div>

              <Link
                href={`/communities/${selectedCommunityId}`}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
              >
                Community Page & Members
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Community Impact Summary */}
            {analytics?.impactSummary && (
              <div className="p-4 rounded-xl bg-emerald-900 text-white flex items-start gap-3 shadow-xs">
                <TrendingUp className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-200 mb-1">
                    Community Impact & Sustainability Ledger
                  </h4>
                  <p className="text-xs text-emerald-50 leading-relaxed font-normal">
                    {analytics.impactSummary}
                  </p>
                </div>
              </div>
            )}

            {/* Metrics cards */}
            {analytics?.metrics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-stone-200">
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-xs text-stone-700 font-semibold block">Active Resources</span>
                  <span className="text-2xl font-bold text-stone-900 mt-1 block">{analytics.metrics.activeResources}</span>
                  <span className="text-xs text-stone-600 font-medium">In this community</span>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-xs text-stone-700 font-semibold block">Completed Shares</span>
                  <span className="text-2xl font-bold text-emerald-700 mt-1 block">{analytics.metrics.completedShares}</span>
                  <span className="text-xs text-stone-600 font-medium">{analytics.metrics.freeLendingCount} free / {analytics.metrics.rentalCount} rented</span>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-xs text-stone-700 font-semibold block">Estimated Savings</span>
                  <span className="text-2xl font-bold text-emerald-700 mt-1 block">₹{analytics.metrics.estimatedSavings.toLocaleString()}</span>
                  <span className="text-xs text-stone-600 font-medium">Avoided purchase costs</span>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-xs text-stone-700 font-semibold block">Community Members</span>
                  <span className="text-2xl font-bold text-stone-900 mt-1 block">{analytics.metrics.activeMembers}</span>
                  <span className="text-xs text-stone-600 font-medium">Verified members</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* User's Listed Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-stone-900">Your Listed Resources</h2>
              <p className="text-xs text-stone-600">Items you have made available to your community</p>
            </div>
            <Link
              href="/resources/new"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
            >
              + Add another listing
            </Link>
          </div>

          {userResources.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-md mx-auto">
              <Package className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-stone-900 mb-1">No items listed yet</h3>
              <p className="text-xs text-stone-600 mb-4">
                Have a drill, camping tent, extra monitor, or textbooks? Put them to work for your neighbors!
              </p>
              <Link
                href="/resources/new"
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition shadow-xs inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                List First Item
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userResources.map((item) => (
                <div
                  key={item.$id}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:border-stone-300 transition flex flex-col"
                >
                  <div className="h-40 bg-stone-100 relative">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <Tag className="w-8 h-8" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-white/95 text-[10px] font-semibold text-stone-800 shadow-xs">
                      {item.category}
                    </span>
                    <span
                      className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase shadow-xs ${
                        item.status === 'available'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-stone-700 text-white'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm truncate">{item.title}</h3>
                      <p className="text-xs text-stone-600 mt-1">
                        Mode: <span className="capitalize font-semibold text-stone-800">{item.exchangeMode}</span>
                        {item.exchangeMode === 'rent' && ` (₹${item.pricePerDay}/day)`}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/resources/${item.$id}`}
                          className="text-emerald-700 font-bold hover:underline"
                        >
                          View Page
                        </Link>
                        <span className="text-stone-300">•</span>
                        <Link
                          href={`/resources/${item.$id}/edit`}
                          className="text-stone-600 font-semibold hover:text-stone-900 hover:underline"
                        >
                          Edit
                        </Link>
                      </div>

                      <Link
                        href={`/requests`}
                        className="text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1"
                      >
                        <Inbox className="w-3.5 h-3.5" />
                        Requests
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

