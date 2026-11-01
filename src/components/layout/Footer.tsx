import Link from 'next/link';
import { Building2, Heart, Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white text-stone-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-stone-900">Commons</span>
            </div>
            <p className="text-stone-600 leading-relaxed">
              A community-first resource sharing network. Lend, rent, and exchange items with your neighbors, colleagues, and campus peers.
            </p>
            <p className="text-emerald-800 font-bold text-xs uppercase tracking-wider">
              Share more. Waste less.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-stone-900 mb-3 text-sm">Explore</h4>
            <ul className="space-y-2 font-medium text-stone-700">
              <li><Link href="/discover" className="hover:text-emerald-700 transition">Discover Catalog</Link></li>
              <li><Link href="/communities/new" className="hover:text-emerald-700 transition">Start a Community</Link></li>
              <li><Link href="/resources/new" className="hover:text-emerald-700 transition">List a Resource</Link></li>
              <li><Link href="/auth" className="hover:text-emerald-700 transition">Account Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-stone-900 mb-3 text-sm">Core Product Loop</h4>
            <ul className="space-y-1.5 text-stone-600 font-medium">
              <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> 1. List or Discover Items</li>
              <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> 2. Request & Conflict Checking</li>
              <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> 3. Owner Approval & Handover</li>
              <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> 4. Safe Return & Trust Reviews</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-stone-900 mb-3 text-sm">Built With</h4>
            <p className="text-stone-600 leading-relaxed mb-2 font-medium">
              Powered exclusively by Appwrite Auth, Appwrite TablesDB, Appwrite Storage, and Next.js SSR.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              Target Operating Cost: ₹0
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-600 font-medium text-xs">
          <p>© {new Date().getFullYear()} Commons Platform. Built for community resilience and sustainability.</p>
          <p className="flex items-center gap-1">
            Fostering circular economies everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}

