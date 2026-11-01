'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@appwrite.io/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  Building2,
  Star,
  CheckCircle2,
  Shield,
  LogOut,
  Loader2,
  Repeat,
  ShieldCheck,
  Award,
  HeartHandshake,
  MessageSquare,
  Lock
} from 'lucide-react';

interface ProfileStats {
  completedLendingCount: number;
  completedBorrowingCount: number;
  totalShares: number;
  averageRating: number | null;
  totalReviews: number;
}

interface BadgeItem {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  icon: string;
}

interface ReviewItem {
  $id: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [memberships, setMemberships] = useState<any[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
      return;
    }

    async function loadProfile() {
      if (!user) return;
      try {
        const [commRes, profileRes] = await Promise.all([
          fetch('/api/communities'),
          fetch('/api/profile'),
        ]);

        const commData = await commRes.json();
        const profileData = await profileRes.json();

        setMemberships(commData.communities || []);
        if (profileData.stats) setStats(profileData.stats);
        if (profileData.reviews) setReviews(profileData.reviews);
        if (profileData.badges) setBadges(profileData.badges);
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadProfile();
    }
  }, [user, authLoading, router]);

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-emerald-700" />;
      case 'Award':
        return <Award className="w-5 h-5 text-amber-600" />;
      case 'HeartHandshake':
        return <HeartHandshake className="w-5 h-5 text-blue-600" />;
      default:
        return <Repeat className="w-5 h-5 text-emerald-700" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-20 text-stone-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-3" />
          <p className="text-sm font-medium">Loading profile...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* User Card */}
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-2xl shadow-sm flex-shrink-0">
              {(user?.name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">{user?.name || 'Community Member'}</h1>
              <p className="text-xs text-stone-700 font-medium flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-stone-500" />
                {user?.email}
              </p>
              <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-700" />
                  Appwrite Verified Auth
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => signOut.signOut({ onSuccess: () => router.push('/auth') })}
            className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        {/* Sharing Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-xs font-semibold text-stone-600 block">Lent to Neighbors</span>
            <span className="text-2xl font-bold text-emerald-800 mt-1 block">
              {stats?.completedLendingCount ?? 0}
            </span>
            <span className="text-[11px] text-stone-500">Completed items</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-xs font-semibold text-stone-600 block">Borrowed Items</span>
            <span className="text-2xl font-bold text-stone-900 mt-1 block">
              {stats?.completedBorrowingCount ?? 0}
            </span>
            <span className="text-[11px] text-stone-500">Returned on time</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-xs font-semibold text-stone-600 block">Total Shares</span>
            <span className="text-2xl font-bold text-stone-900 mt-1 block">
              {stats?.totalShares ?? 0}
            </span>
            <span className="text-[11px] text-stone-500">Resource cycles</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-xs font-semibold text-stone-600 block">Average Rating</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-2xl font-bold text-amber-600">
                {stats?.averageRating ? stats.averageRating.toFixed(1) : '—'}
              </span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <span className="text-[11px] text-stone-500">
              {stats?.totalReviews ? `${stats.totalReviews} verified review(s)` : 'No reviews yet'}
            </span>
          </div>
        </div>

        {/* Trust & Reputation Badges */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-700" />
                Community Trust Badges
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Earned automatically through verified borrowing, lending, and active participation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 rounded-xl border flex items-start gap-3 transition ${
                  badge.earned
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-stone-200 bg-stone-50/50 opacity-60'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    badge.earned ? 'bg-white shadow-2xs' : 'bg-stone-200'
                  }`}
                >
                  {badge.earned ? getBadgeIcon(badge.icon) : <Lock className="w-4 h-4 text-stone-400" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-stone-900 text-xs">{badge.title}</h3>
                    {badge.earned && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        Earned
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                    {badge.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verified Reviews Section */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              Verified Community Reviews ({reviews.length})
            </h2>
            <Link
              href="/requests"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View Requests Inbox →
            </Link>
          </div>

          {reviews.length === 0 ? (
            <div className="p-8 text-center bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <Star className="w-8 h-8 text-stone-300 mx-auto" />
              <h3 className="text-xs font-bold text-stone-800">No reviews yet</h3>
              <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
                Once you complete your first lending or borrowing transaction, verified feedback will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div
                  key={r.$id}
                  className="p-4 rounded-xl border border-stone-100 bg-stone-50/50 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= r.rating ? 'fill-current' : 'text-stone-300'
                          }`}
                        />
                      ))}
                      <span className="text-xs font-bold text-stone-900 ml-1.5">
                        {r.rating}.0
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 font-medium">
                      {new Date(r.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  {r.comment && (
                    <p className="text-xs text-stone-700 leading-relaxed font-normal">
                      "{r.comment}"
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-[10px] text-emerald-800 font-semibold pt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verified Completed Transaction</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Community Memberships */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-700" />
            Your Community Hubs
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {memberships.slice(0, 4).map((c) => (
              <Link
                key={c.$id}
                href={`/communities/${c.$id}`}
                className="p-4 rounded-xl border border-stone-200 hover:border-emerald-600 hover:bg-stone-50/50 transition flex items-center justify-between"
              >
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">{c.name}</h3>
                  <p className="text-xs text-stone-600 font-medium">
                    {c.city}, {c.region}
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-700">Open Hub →</span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
