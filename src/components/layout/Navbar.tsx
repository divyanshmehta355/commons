'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@appwrite.io/react';
import { useState, useEffect } from 'react';
import { Building2, PlusCircle, Compass, LayoutDashboard, Inbox, LogOut, LogIn, Bookmark, Bell } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((d) => {
        if (typeof d.unreadCount === 'number') {
          setUnreadCount(d.unreadCount);
        }
      })
      .catch(() => {});
  }, [user, pathname]);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-sm group-hover:bg-emerald-800 transition">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-stone-900 block leading-tight">Commons</span>
                <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-widest block -mt-0.5">Share More</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/discover"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/discover')
                    ? 'bg-emerald-50 text-emerald-900'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Compass className="w-4 h-4 text-emerald-700" />
                Discover
              </Link>

              {user && (
                <>
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive('/dashboard')
                        ? 'bg-emerald-50 text-emerald-900'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-emerald-700" />
                    Dashboard
                  </Link>

                  <Link
                    href="/requests"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive('/requests')
                        ? 'bg-emerald-50 text-emerald-900'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <Inbox className="w-4 h-4 text-emerald-700" />
                    Requests
                  </Link>

                  <Link
                    href="/wishlist"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive('/wishlist')
                        ? 'bg-emerald-50 text-emerald-900'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <Bookmark className="w-4 h-4 text-emerald-700" />
                    Wishlist
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/resources/new"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  List Item
                </Link>

                <Link
                  href="/notifications"
                  className="relative p-2 text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition border border-stone-200"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4 text-emerald-800" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white font-bold text-[9px] min-w-4 text-center shadow-xs">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-200 hover:border-emerald-600 text-stone-700 text-xs font-medium transition"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    {(user.name || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[120px] truncate">{user.name || 'Member'}</span>
                </Link>

                <button
                  onClick={() => signOut.signOut({ onSuccess: () => { window.location.href = '/auth'; } })}
                  title="Sign out"
                  className="p-2 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

