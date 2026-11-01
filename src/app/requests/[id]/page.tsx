'use client';

import { useState, useEffect, use } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@appwrite.io/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Building2,
  CheckCircle2,
  ArrowRight,
  Shield,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function RequestDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/requests/${id}`);
        const resData = await res.json();
        if (resData.error) {
          setError(resData.error);
        } else {
          setData(resData);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load request');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-20 text-stone-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-3" />
          <p className="text-sm font-medium">Loading request...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-stone-900 mb-2">Request Error</h2>
          <p className="text-stone-500 text-sm mb-6">{error || 'Could not load request.'}</p>
          <Link href="/requests" className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-sm font-medium">
            Back to Requests
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { request, resource, community, transaction, isOwner, isBorrower } = data;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-6">
          <Link href="/requests" className="text-xs text-stone-500 hover:text-emerald-700 mb-2 inline-block">
            ← Back to Requests Inbox
          </Link>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Request #{request.$id.slice(-6)}</h1>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <span className="text-xs text-stone-500 block">Status</span>
              <span className="text-sm font-bold capitalize text-emerald-800">{request.status}</span>
            </div>
            <div>
              <span className="text-xs text-stone-500 block">Role</span>
              <span className="text-sm font-semibold text-stone-800">{isOwner ? 'Resource Owner' : 'Borrower'}</span>
            </div>
            <div>
              <span className="text-xs text-stone-500 block">Quote</span>
              <span className="text-sm font-bold text-stone-900">₹{request.quotedTotal}</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Resource</h3>
            <p className="text-lg font-bold text-stone-900">{resource?.title || 'Resource'}</p>
            <p className="text-xs text-stone-500 mt-0.5">{community?.name} • Pickup: {resource?.pickupArea || 'Campus Area'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
              <span className="text-stone-400 block mb-1">Start Date</span>
              <span className="font-semibold text-stone-900">{request.startAt.slice(0, 10)}</span>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
              <span className="text-stone-400 block mb-1">End Date</span>
              <span className="font-semibold text-stone-900">{request.endAt.slice(0, 10)}</span>
            </div>
          </div>

          {request.message && (
            <div>
              <h4 className="text-xs font-semibold text-stone-500 mb-1">Message</h4>
              <p className="text-xs text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-100 italic">
                "{request.message}"
              </p>
            </div>
          )}

          {transaction && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-emerald-900">Active Transaction Linked</h4>
                <p className="text-[11px] text-emerald-700">Status: {transaction.status}</p>
              </div>
              <Link
                href={`/transactions/${transaction.$id}`}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
              >
                <span>Go to Handover / Return</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

