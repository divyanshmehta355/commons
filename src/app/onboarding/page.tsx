'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@appwrite.io/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  PlusCircle,
  Search,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Users,
  Globe,
  Lock,
} from 'lucide-react';

type Step = 'welcome' | 'join_or_create' | 'join' | 'create' | 'done';

export default function OnboardingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>('welcome');
  const [communities, setCommunities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState<any>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    city: '',
    region: '',
    visibility: 'public' as 'public' | 'private',
    joinCode: '',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (step === 'join') {
      fetchCommunities();
    }
  }, [step]);

  async function fetchCommunities(q?: string) {
    try {
      const url = q ? `/api/communities?search=${encodeURIComponent(q)}` : '/api/communities';
      const res = await fetch(url);
      const data = await res.json();
      setCommunities(data.communities || []);
    } catch {
      /* ignore */
    }
  }

  async function handleJoin(communityId: string, isPrivate: boolean) {
    if (isPrivate && !joinCode.trim()) {
      setJoinError('This community requires a join code.');
      return;
    }
    setJoining(true);
    setJoinError('');
    try {
      const res = await fetch(`/api/communities/${communityId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: joinCode.trim() || undefined }),
      });
      if (!res.ok) {
        const d = await res.json();
        setJoinError(d.error || 'Failed to join community.');
        return;
      }
      setStep('done');
    } catch {
      setJoinError('Network error. Please try again.');
    } finally {
      setJoining(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim()) {
      setCreateError('Name and city are required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          city: form.city,
          region: form.region,
          visibility: form.visibility,
          joinCode: form.joinCode || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setCreateError(d.error || 'Failed to create community.');
        return;
      }
      setStep('done');
    } catch {
      setCreateError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-stone-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Step: Welcome */}
        {step === 'welcome' && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-700 text-white mb-2">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
                Welcome to Commons, {user?.name?.split(' ')[0] || 'there'}!
              </h1>
              <p className="mt-2 text-stone-500 text-sm leading-relaxed">
                Commons helps you share resources with your community — neighbours, classmates, hostel mates, and more.
                Get started by joining or creating your first community.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left pt-2">
              {[
                { icon: '📦', label: 'List items', desc: 'Share tools, books, gear, and more.' },
                { icon: '🔍', label: 'Discover', desc: 'Find what you need nearby.' },
                { icon: '🤝', label: 'Request & Lend', desc: 'Send and approve sharing requests.' },
                { icon: '⭐', label: 'Build trust', desc: 'Reviews build your community rep.' },
              ].map((f) => (
                <div key={f.label} className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <div className="text-2xl mb-1">{f.icon}</div>
                  <div className="font-semibold text-stone-800 text-xs">{f.label}</div>
                  <div className="text-[11px] text-stone-500">{f.desc}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('join_or_create')}
              className="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step: Join or Create */}
        {step === 'join_or_create' && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-stone-900">Your first community</h2>
              <p className="text-stone-500 text-sm mt-1">
                Join an existing community or create your own. You can always join more later.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => setStep('join')}
                className="p-5 rounded-2xl border-2 border-stone-200 hover:border-emerald-600 hover:bg-emerald-50 text-left transition group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Search className="w-5 h-5 text-emerald-700" />
                  <span className="font-bold text-stone-900 group-hover:text-emerald-800">Join a community</span>
                </div>
                <p className="text-xs text-stone-500">
                  Your college, hostel, apartment complex, or neighbourhood probably already has one.
                </p>
              </button>

              <button
                onClick={() => setStep('create')}
                className="p-5 rounded-2xl border-2 border-stone-200 hover:border-emerald-600 hover:bg-emerald-50 text-left transition group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <PlusCircle className="w-5 h-5 text-emerald-700" />
                  <span className="font-bold text-stone-900 group-hover:text-emerald-800">Create a community</span>
                </div>
                <p className="text-xs text-stone-500">
                  Start one for your building, campus, or group. Invite others to join.
                </p>
              </button>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full text-xs text-stone-600 hover:text-stone-900 font-medium transition"
            >
              Skip for now → Go to dashboard
            </button>
          </div>
        )}

        {/* Step: Join */}
        {step === 'join' && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 space-y-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('join_or_create')}
                className="text-xs text-stone-600 hover:text-stone-900 font-medium"
              >
                ← Back
              </button>
              <h2 className="text-xl font-extrabold text-stone-900">Find your community</h2>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="text"
                placeholder="Search by name or city..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchCommunities(e.target.value);
                }}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 bg-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>

            {joinError && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{joinError}</p>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {communities.length === 0 && (
                <p className="text-xs text-stone-600 font-medium text-center py-6">No communities found.</p>
              )}
              {communities.map((c) => (
                <div
                  key={c.$id}
                  onClick={() => setSelectedCommunity(selectedCommunity?.$id === c.$id ? null : c)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    selectedCommunity?.$id === c.$id
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-stone-900 text-sm">{c.name}</div>
                      <div className="text-xs text-stone-500">
                        {c.city}, {c.region}
                      </div>
                    </div>
                    <span
                      className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        c.visibility === 'public'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {c.visibility === 'public' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      {c.visibility}
                    </span>
                  </div>

                  {selectedCommunity?.$id === c.$id && (
                    <div className="mt-3 space-y-2">
                      {c.visibility === 'private' && (
                        <input
                          type="text"
                          placeholder="Enter join code"
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-3 py-2 rounded-lg border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                        />
                      )}
                      <button
                        disabled={joining}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoin(c.$id, c.visibility === 'private');
                        }}
                        className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        {joining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                        Join {c.name}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-stone-600 font-medium text-center">
              Don't see yours?{' '}
              <button
                onClick={() => setStep('create')}
                className="text-emerald-700 font-bold hover:underline"
              >
                Create it
              </button>
            </p>
          </div>
        )}

        {/* Step: Create */}
        {step === 'create' && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 space-y-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('join_or_create')}
                className="text-xs text-stone-600 hover:text-stone-900 font-medium"
              >
                ← Back
              </button>
              <h2 className="text-xl font-extrabold text-stone-900">Create a community</h2>
            </div>

            {createError && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{createError}</p>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Community Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Maple Residency Block B"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What is this community for?"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">City *</label>
                  <input
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Bengaluru"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">State / Region</label>
                  <input
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    placeholder="e.g. Karnataka"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-2">Visibility</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['public', 'private'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm({ ...form, visibility: v })}
                      className={`p-3 rounded-xl border-2 text-left transition ${
                        form.visibility === v
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {v === 'public' ? <Globe className="w-3.5 h-3.5 text-emerald-700" /> : <Lock className="w-3.5 h-3.5 text-stone-600" />}
                        <span className="text-xs font-bold capitalize text-stone-900">{v}</span>
                      </div>
                      <p className="text-[10px] text-stone-500">
                        {v === 'public' ? 'Anyone can find and join' : 'Invite only with join code'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {form.visibility === 'private' && (
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Join Code</label>
                  <input
                    value={form.joinCode}
                    onChange={(e) => setForm({ ...form, joinCode: e.target.value })}
                    placeholder="e.g. MAPLE2024"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 font-mono"
                  />
                  <p className="text-xs text-stone-600 font-medium mt-1">Share this code with your members.</p>
                </div>
              )}

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                Create Community
              </button>
            </form>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-stone-900">You're in!</h2>
              <p className="text-stone-500 text-sm mt-2">
                Your community is ready. Start by listing something you own, or discover what's available nearby.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/resources/new"
                className="py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                List an item
              </Link>
              <Link
                href="/discover"
                className="py-3 rounded-2xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 font-bold text-sm transition flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Discover
              </Link>
            </div>

            <Link
              href="/dashboard"
              className="text-xs text-emerald-700 hover:underline font-semibold"
            >
              Go to Dashboard →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

