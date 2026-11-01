'use client';

import { useState } from 'react';
import { useAuth } from '@appwrite.io/react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, LogOut, CheckCircle2, AlertCircle, Loader2, Building2 } from 'lucide-react';
import Link from 'next/link';

export function AuthPanel({ ssrUserEmail }: { ssrUserEmail?: string | null }) {
  const {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    error: authError
  } = useAuth();

  const router = useRouter();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const isSubmitting = signIn.isPending || signUp.isPending || signOut.isPending;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email || !password) {
      setLocalError('Please fill in both email and password.');
      return;
    }
    signIn.emailPassword({
      email,
      password,
      onSuccess: () => {
        // Full navigation ensures SSR RootLayout reads the newly set session cookie
        window.location.href = '/dashboard';
      },
      onError: (err) => {
        setLocalError(err.message || 'Failed to sign in. Please check your credentials.');
      }
    });
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email || !password || !name) {
      setLocalError('Please fill in your name, email, and password.');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters long.');
      return;
    }
    signUp.emailPassword({
      email,
      password,
      name,
      onSuccess: () => {
        // Automatically sign in upon successful registration
        signIn.emailPassword({
          email,
          password,
          onSuccess: () => {
            // New users → onboarding flow with full navigation
            window.location.href = '/onboarding';
          },
          onError: (err) => {
            setLocalError(err.message);
          }
        });
      },
      onError: (err) => {
        setLocalError(err.message || 'Failed to create account.');
      }
    });
  };

  const displayError = localError || authError?.message || signIn.error?.message || signUp.error?.message;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-stone-600 bg-white rounded-2xl border border-stone-200 shadow-sm max-w-md mx-auto w-full">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
        <p className="text-sm font-medium">Verifying authentication status...</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 max-w-md mx-auto w-full text-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-semibold text-stone-900 mb-1">Welcome back, {user.name || 'Member'}!</h2>
        <p className="text-stone-500 text-sm mb-6">{user.email}</p>

        {ssrUserEmail && (
          <div className="mb-6 p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 text-left">
            <span className="font-semibold">SSR Session Verified:</span> {ssrUserEmail}
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium transition shadow-sm"
          >
            Go to Commons Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={() => {
              signOut.signOut({
                onSuccess: () => {
                  window.location.href = '/auth';
                }
              });
            }}
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-medium transition"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 max-w-md mx-auto w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Commons</h1>
        <p className="text-xs font-medium text-emerald-700 uppercase tracking-widest mt-1">Share more. Waste less.</p>
        <p className="text-sm text-stone-500 mt-2">
          {mode === 'signin' ? 'Sign in to access your community resources' : 'Join your local community to borrow, lend, and exchange'}
        </p>
      </div>

      <div className="flex rounded-xl bg-stone-100 p-1 mb-6">
        <button
          type="button"
          onClick={() => { setMode('signin'); setLocalError(null); }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
            mode === 'signin' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setMode('signup'); setLocalError(null); }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
            mode === 'signup' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          Create Account
        </button>
      </div>

      <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                required
                className="w-full pl-9 pr-3 py-2 text-sm text-stone-900 bg-white placeholder:text-stone-500 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-stone-800 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@community.edu"
              required
              className="w-full pl-9 pr-3 py-2 text-sm text-stone-900 bg-white placeholder:text-stone-500 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-800 mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full pl-9 pr-3 py-2 text-sm text-stone-900 bg-white placeholder:text-stone-500 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition"
            />
          </div>
          {mode === 'signup' && (
            <p className="text-[11px] text-stone-600 font-medium mt-1">Minimum 8 characters</p>
          )}
        </div>

        {displayError && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="leading-snug">{displayError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-medium text-sm transition shadow-sm mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : mode === 'signin' ? (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-stone-100 text-center">
        <p className="text-xs text-stone-500">
          Powered by Appwrite Auth and SSR Sessions
        </p>
      </div>
    </div>
  );
}

