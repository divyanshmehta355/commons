'use client';

import { useState, useEffect, use } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@appwrite.io/react';
import Link from 'next/link';
import {
  Building2,
  Users,
  MapPin,
  Lock,
  Globe,
  Tag,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  Package,
  Layers,
  Trophy,
  Target,
  Calendar
} from 'lucide-react';

export default function CommunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();

  const [community, setCommunity] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Join state
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // View mode & Bundles state
  const [activeTab, setActiveTab] = useState<'catalog' | 'bundles'>('catalog');
  const [bundles, setBundles] = useState<any[]>([]);
  const [loadingBundles, setLoadingBundles] = useState(false);
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [bundleTitle, setBundleTitle] = useState('');
  const [bundleDesc, setBundleDesc] = useState('');
  const [selectedBundleResourceIds, setSelectedBundleResourceIds] = useState<string[]>([]);
  const [creatingBundle, setCreatingBundle] = useState(false);
  const [bundleError, setBundleError] = useState<string | null>(null);
  const [bundleSuccess, setBundleSuccess] = useState(false);

  const fetchBundles = async () => {
    setLoadingBundles(true);
    try {
      const res = await fetch(`/api/communities/${id}/bundles`);
      const data = await res.json();
      if (data.bundles) {
        setBundles(data.bundles);
      }
    } catch {
      // ignore
    } finally {
      setLoadingBundles(false);
    }
  };

  const handleCreateBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/auth';
      return;
    }
    if (selectedBundleResourceIds.length < 2) {
      setBundleError('Please select at least 2 resources for the kit');
      return;
    }
    setCreatingBundle(true);
    setBundleError(null);
    try {
      const res = await fetch(`/api/communities/${id}/bundles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bundleTitle,
          description: bundleDesc,
          resourceIds: selectedBundleResourceIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBundleError(data.error || 'Failed to create bundle');
      } else {
        setBundleSuccess(true);
        setTimeout(() => {
          setShowBundleModal(false);
          setBundleSuccess(false);
          setBundleTitle('');
          setBundleDesc('');
          setSelectedBundleResourceIds([]);
          fetchBundles();
        }, 1500);
      }
    } catch (err: any) {
      setBundleError(err.message || 'Error creating bundle');
    } finally {
      setCreatingBundle(false);
    }
  };

  // Challenges state
  const [challenges, setChallenges] = useState<any[]>([]);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeDesc, setChallengeDesc] = useState('');
  const [challengeTarget, setChallengeTarget] = useState(25);
  const [challengeStart, setChallengeStart] = useState(new Date().toISOString().slice(0, 10));
  const [challengeEnd, setChallengeEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [creatingChallenge, setCreatingChallenge] = useState(false);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [challengeSuccess, setChallengeSuccess] = useState(false);

  const fetchChallenges = async () => {
    try {
      const res = await fetch(`/api/communities/${id}/challenges`);
      const data = await res.json();
      if (data.challenges) {
        setChallenges(data.challenges);
      }
    } catch {
      // ignore
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/auth';
      return;
    }
    setCreatingChallenge(true);
    setChallengeError(null);
    try {
      const res = await fetch(`/api/communities/${id}/challenges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: challengeTitle,
          description: challengeDesc,
          targetShares: Number(challengeTarget),
          startDate: challengeStart,
          endDate: challengeEnd,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setChallengeError(data.error || 'Failed to create challenge');
      } else {
        setChallengeSuccess(true);
        setTimeout(() => {
          setShowChallengeModal(false);
          setChallengeSuccess(false);
          setChallengeTitle('');
          setChallengeDesc('');
          fetchChallenges();
        }, 1500);
      }
    } catch (err: any) {
      setChallengeError(err.message || 'Error creating challenge');
    } finally {
      setCreatingChallenge(false);
    }
  };

  const loadData = async () => {
    try {
      const [commRes, memRes, resRes] = await Promise.all([
        fetch(`/api/communities/${id}`),
        fetch(`/api/communities/${id}/members`),
        fetch(`/api/resources?communityId=${id}`),
      ]);

      const [commData, memData, resData] = await Promise.all([
        commRes.json(),
        memRes.json(),
        resRes.json(),
      ]);

      if (commData.error) {
        setError(commData.error);
      } else {
        setCommunity(commData.community);
        setMembers(memData.members || []);
        setResources(resData.resources || []);
        fetchBundles();
        fetchChallenges();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load community details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/auth';
      return;
    }

    setJoining(true);
    setJoinError(null);

    try {
      const res = await fetch(`/api/communities/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setJoinError(data.error || 'Failed to join');
      } else {
        setJoinSuccess(true);
        loadData();
      }
    } catch (err: any) {
      setJoinError(err.message || 'Join failed');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-20 text-stone-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-3" />
          <p className="text-sm font-medium">Loading community...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-stone-900 mb-2">Community Not Found</h2>
          <p className="text-stone-500 text-sm mb-6">{error || 'This community does not exist.'}</p>
          <Link href="/discover" className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-sm font-medium">
            Explore All Communities
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const currentUserMembership = user
    ? members.find((m) => m.userId === user.$id && m.status === 'active')
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Header Hero */}
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                {community.visibility === 'public' ? (
                  <>
                    <Globe className="w-3.5 h-3.5" /> Public Community
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Private Community
                  </>
                )}
              </span>
              <span className="text-xs text-stone-700 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-500" />
                {community.city}, {community.region}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">{community.name}</h1>
            <p className="text-stone-600 text-sm max-w-2xl leading-relaxed">
              {community.description || 'Community resource sharing network.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {currentUserMembership ? (
              <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Joined ({currentUserMembership.role})</span>
              </div>
            ) : (
              <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-2">
                {community.hasJoinCode && (
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Enter Join Code"
                    required
                    className="px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                )}
                <button
                  type="submit"
                  disabled={joining}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  {joining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
                  Join Community
                </button>
              </form>
            )}

            <Link
              href="/resources/new"
              className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition text-center flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />
              List an Item
            </Link>
          </div>
        </div>

        {joinError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{joinError}</p>
          </div>
        )}

        {/* Catalog & Members grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main content (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* View Switcher Tabs */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex rounded-xl bg-stone-200/60 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className={`py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
                    activeTab === 'catalog'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  Item Catalog ({resources.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('bundles')}
                  className={`py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
                    activeTab === 'bundles'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  Curated Kits ({bundles.length})
                </button>
              </div>

              {activeTab === 'bundles' && currentUserMembership && (
                <button
                  type="button"
                  onClick={() => setShowBundleModal(true)}
                  className="py-1.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition shadow-xs flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Create Kit
                </button>
              )}
            </div>

            {activeTab === 'catalog' ? (
              resources.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center">
                  <Tag className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-stone-800">No resources listed in this community yet.</p>
                  <p className="text-xs text-stone-600 font-medium mt-1 mb-4">Be the first to offer an item to your neighbors!</p>
                  <Link
                    href="/resources/new"
                    className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition"
                  >
                    List Item
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {resources.map((item) => (
                    <Link
                      key={item.$id}
                      href={`/resources/${item.$id}`}
                      className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:border-emerald-600 transition flex flex-col"
                    >
                      <div className="h-36 bg-stone-100 relative">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400">
                            <Tag className="w-8 h-8" />
                          </div>
                        )}
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/95 text-[10px] font-semibold text-stone-800 shadow-xs">
                          {item.category}
                        </span>
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[10px] font-semibold shadow-xs">
                          {item.exchangeMode === 'free' ? 'Free' : `₹${item.pricePerDay}/day`}
                        </span>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-stone-900 text-sm group-hover:text-emerald-700 transition truncate">
                            {item.title}
                          </h3>
                          <p className="text-xs text-stone-600 mt-1 line-clamp-1">{item.description}</p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600 font-medium">
                          <span className="capitalize text-stone-700 font-medium">Condition: {item.condition}</span>
                          <span className="text-emerald-700 font-bold">{item.status}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ) : (
              /* Bundles View */
              loadingBundles ? (
                <div className="flex flex-col items-center justify-center p-16 text-stone-500">
                  <Loader2 className="w-7 h-7 animate-spin text-emerald-700 mb-2" />
                  <p className="text-xs">Loading kits...</p>
                </div>
              ) : bundles.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center">
                  <Package className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-stone-800">No resource kits created yet.</p>
                  <p className="text-xs text-stone-600 font-medium mt-1 mb-4">
                    Bundle complementary items (e.g. camping kit, lawn maintenance pack) to make sharing simpler!
                  </p>
                  {currentUserMembership && (
                    <button
                      type="button"
                      onClick={() => setShowBundleModal(true)}
                      className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition"
                    >
                      Create First Kit
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {bundles.map((bundle) => (
                    <div
                      key={bundle.$id}
                      className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                bundle.allAvailable
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {bundle.allAvailable ? 'All Items Ready' : 'Partially In Use'}
                            </span>
                            <span className="text-xs text-stone-400">•</span>
                            <span className="text-xs text-stone-500 font-medium">
                              {bundle.itemCount} item kit
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-stone-900">{bundle.title}</h3>
                          {bundle.description && (
                            <p className="text-xs text-stone-600 mt-1">{bundle.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Items in this bundle */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                        {bundle.items?.map((item: any) => (
                          <Link
                            key={item.$id}
                            href={`/resources/${item.$id}`}
                            className="p-3 rounded-xl bg-stone-50 border border-stone-200 hover:border-emerald-600 transition flex items-center justify-between"
                          >
                            <div className="min-w-0 pr-2">
                              <h4 className="text-xs font-bold text-stone-900 truncate">{item.title}</h4>
                              <p className="text-[10px] text-stone-500 capitalize">{item.category} • {item.condition}</p>
                            </div>
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${
                                item.status === 'available'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.status}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Community Challenges & Goals */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-600" />
                  Challenges ({challenges.length})
                </h3>
                {(currentUserMembership?.role === 'owner' || currentUserMembership?.role === 'admin') && (
                  <button
                    type="button"
                    onClick={() => setShowChallengeModal(true)}
                    className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    New
                  </button>
                )}
              </div>

              {challenges.length === 0 ? (
                <div className="p-4 rounded-xl bg-stone-50 text-center space-y-1">
                  <Target className="w-6 h-6 text-stone-400 mx-auto" />
                  <p className="text-xs font-bold text-stone-700">No Active Challenges</p>
                  <p className="text-[11px] text-stone-500">Community goals will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {challenges.map((ch) => (
                    <div key={ch.$id} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-stone-900">{ch.title}</h4>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${
                            ch.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ch.status === 'expired'
                              ? 'bg-stone-200 text-stone-600'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ch.status === 'completed' ? 'Goal Achieved!' : `${ch.daysRemaining}d left`}
                        </span>
                      </div>

                      {ch.description && (
                        <p className="text-[11px] text-stone-600">{ch.description}</p>
                      )}

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-stone-700">
                          <span>{ch.currentShares} / {ch.targetShares} shares</span>
                          <span className="text-emerald-800 font-bold">{ch.percentComplete}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                            style={{ width: `${ch.percentComplete}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Members list */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-700" />
                  Members ({members.length})
                </h3>
              </div>

              <div className="space-y-3 divide-y divide-stone-100">
                {members.map((m) => (
                  <div key={m.$id} className="pt-3 first:pt-0 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                        {(m.displayName || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-stone-900">{m.displayName || 'Community Member'}</h4>
                        <span className="text-xs text-stone-600 font-medium capitalize">Joined {m.joinedAt?.slice(0, 10)}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                        m.role === 'owner'
                          ? 'bg-amber-100 text-amber-800'
                          : m.role === 'admin'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Create Bundle Modal */}
        {showBundleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">Create Resource Kit</h3>
                    <p className="text-[11px] text-stone-500">Group 2 or more complementary items together</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBundleModal(false)}
                  className="text-stone-400 hover:text-stone-600 text-sm font-bold p-1"
                >
                  ×
                </button>
              </div>

              {bundleSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700 mx-auto" />
                  <p className="text-xs font-bold text-emerald-900">Resource Kit Created!</p>
                  <p className="text-[11px] text-emerald-700">
                    Your kit is now available for the community to browse.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCreateBundle} className="space-y-4">
                  {bundleError && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p className="leading-snug">{bundleError}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Kit Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Weekend Camping Set, Woodworking Starter Pack"
                      value={bundleTitle}
                      onChange={(e) => setBundleTitle(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Explain what this kit is great for..."
                      value={bundleDesc}
                      onChange={(e) => setBundleDesc(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Select Items to Include (at least 2) *
                    </label>
                    <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-xl p-2 space-y-1.5 bg-stone-50">
                      {resources.length === 0 ? (
                        <p className="text-xs text-stone-500 p-2">No resources available to bundle</p>
                      ) : (
                        resources.map((item) => {
                          const isSelected = selectedBundleResourceIds.includes(item.$id);
                          return (
                            <label
                              key={item.$id}
                              className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer text-xs transition ${
                                isSelected ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'hover:bg-white text-stone-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedBundleResourceIds([...selectedBundleResourceIds, item.$id]);
                                  } else {
                                    setSelectedBundleResourceIds(selectedBundleResourceIds.filter((id) => id !== item.$id));
                                  }
                                }}
                                className="rounded text-emerald-700 focus:ring-emerald-600"
                              />
                              <span className="truncate">{item.title}</span>
                              <span className="text-[10px] text-stone-400 capitalize ml-auto flex-shrink-0">
                                {item.category}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowBundleModal(false)}
                      className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingBundle}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs transition shadow-xs flex items-center gap-1.5"
                    >
                      {creatingBundle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />}
                      Create Kit
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
        {/* Create Challenge Modal */}
        {showChallengeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">Launch Community Challenge</h3>
                    <p className="text-[11px] text-stone-500">Set a resource-sharing goal for members</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChallengeModal(false)}
                  className="text-stone-400 hover:text-stone-600 text-sm font-bold p-1"
                >
                  ×
                </button>
              </div>

              {challengeSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700 mx-auto" />
                  <p className="text-xs font-bold text-emerald-900">Challenge Launched!</p>
                  <p className="text-[11px] text-emerald-700">
                    The sharing goal has been published to the community dashboard.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCreateChallenge} className="space-y-4">
                  {challengeError && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p className="leading-snug">{challengeError}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Challenge Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Spring Tool Drive, 50 Items Shared Sprint"
                      value={challengeTitle}
                      onChange={(e) => setChallengeTitle(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Target Completed Shares *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={challengeTarget}
                      onChange={(e) => setChallengeTarget(Number(e.target.value))}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-stone-700 block mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={challengeStart}
                        onChange={(e) => setChallengeStart(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-700 block mb-1">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={challengeEnd}
                        onChange={(e) => setChallengeEnd(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Share context and excitement about this goal..."
                      value={challengeDesc}
                      onChange={(e) => setChallengeDesc(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowChallengeModal(false)}
                      className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingChallenge}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs transition shadow-xs flex items-center gap-1.5"
                    >
                      {creatingChallenge ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trophy className="w-3.5 h-3.5" />}
                      Launch Goal
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

