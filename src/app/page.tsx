import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { dbService } from '@/lib/appwrite/tables';
import {
  Building2,
  ArrowRight,
  Shield,
  Repeat,
  HeartHandshake,
  Search,
  CheckCircle2,
  TrendingUp,
  Tag,
  Users
} from 'lucide-react';

export default async function HomePage() {
  // Fetch real statistics from Appwrite TablesDB
  let communitiesCount = 0;
  let resourcesCount = 0;
  let transactionsCount = 0;
  let estimatedSavings = 0;
  let sampleItems: any[] = [];

  try {
    const communities = await dbService.listCommunities();
    communitiesCount = communities.filter(c => c.status !== 'archived').length;

    const resources = await dbService.listResources();
    resourcesCount = resources.filter(r => r.status === 'available').length;
    sampleItems = resources.filter(r => r.status === 'available').slice(0, 6);

    const requests = await dbService.listBorrowRequests();
    const completed = requests.filter(r => r.status === 'completed');
    transactionsCount = completed.length;
    estimatedSavings = completed.length * 1500;
  } catch (err) {
    console.warn('Home page data fetch error:', err);
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-32 border-b border-stone-200 bg-gradient-to-b from-emerald-50/50 via-white to-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-6">
            <HeartHandshake className="w-3.5 h-3.5" />
            Community-First Resource Sharing
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-stone-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Share more. <span className="text-emerald-700 underline decoration-emerald-300 decoration-wavy underline-offset-8">Waste less.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Why buy what your community already owns? Borrow textbooks, tools, camping gear, and electronics from trusted people nearby.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/discover"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-base shadow-sm transition"
            >
              <Search className="w-4 h-4" />
              Discover Resources
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              href="/communities/new"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 font-medium text-base transition shadow-xs"
            >
              <Building2 className="w-4 h-4 text-emerald-700" />
              Start a Community
            </Link>
          </div>

          {/* Quick Metrics from Appwrite TablesDB */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 border-t border-stone-200/80">
            <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs text-center">
              <span className="block text-2xl sm:text-3xl font-bold text-stone-900">{resourcesCount}</span>
              <span className="text-xs text-stone-500 font-medium">Available Items</span>
            </div>
            <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs text-center">
              <span className="block text-2xl sm:text-3xl font-bold text-emerald-700">{communitiesCount}</span>
              <span className="text-xs text-stone-500 font-medium">Active Communities</span>
            </div>
            <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs text-center">
              <span className="block text-2xl sm:text-3xl font-bold text-stone-900">{transactionsCount}</span>
              <span className="text-xs text-stone-500 font-medium">Completed Shares</span>
            </div>
            <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs text-center">
              <span className="block text-2xl sm:text-3xl font-bold text-emerald-700">₹{estimatedSavings.toLocaleString()}</span>
              <span className="text-xs text-stone-500 font-medium">Community Savings</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Loop Section */}
      <section className="py-20 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-2">The Commons Lifecycle</h2>
            <p className="text-3xl font-bold text-stone-900 tracking-tight">Built on community, verified by trust</p>
            <p className="mt-3 text-stone-600 text-sm">
              Commons is not a random classifieds board. You share with verified neighbors and peers in your college campus, housing complex, or local club.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base mb-4">1</div>
              <h3 className="font-semibold text-stone-900 text-base mb-2">List or Discover</h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                Add an item you rarely use or search the community catalog to find tools, books, cameras, or sports gear.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base mb-4">2</div>
              <h3 className="font-semibold text-stone-900 text-base mb-2">Request & Availability</h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                Choose dates and sharing mode (free lending, rental, or exchange). Server validates booking intervals.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base mb-4">3</div>
              <h3 className="font-semibold text-stone-900 text-base mb-2">Approve & Handover</h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                Owner approves the request. Both parties confirm handover at the agreed campus or neighborhood spot.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base mb-4">4</div>
              <h3 className="font-semibold text-stone-900 text-base mb-2">Return & Build Trust</h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                Confirm return, complete the transaction, and submit verified peer reviews to build community reputation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Items from TablesDB */}
      {sampleItems.length > 0 && (
        <section className="py-20 bg-stone-50 border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <h2 className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">Live Catalog</h2>
                <p className="text-2xl font-bold text-stone-900">Recently listed in your communities</p>
              </div>
              <Link
                href="/discover"
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
              >
                View all items
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleItems.map((item) => (
                <Link
                  key={item.$id}
                  href={`/resources/${item.$id}`}
                  className="group rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-600 transition flex flex-col"
                >
                  <div className="h-48 bg-stone-100 relative overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400 bg-stone-100">
                        <Tag className="w-10 h-10" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-xs text-[11px] font-semibold text-stone-800 shadow-xs">
                      {item.category}
                    </span>
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-emerald-700 text-white text-[11px] font-semibold shadow-xs">
                      {item.exchangeMode === 'free' ? 'Free Lending' : item.exchangeMode === 'rent' ? `₹${item.pricePerDay}/day` : 'Exchange'}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-stone-900 text-base group-hover:text-emerald-700 transition line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-stone-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                        {item.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                      <span>Condition: <span className="capitalize font-medium text-stone-800">{item.condition}</span></span>
                      <span className="text-emerald-700 font-medium">Available</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Circular Economy Callout */}
      <section className="py-16 bg-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-800 text-emerald-200 text-xs font-medium">
                <HeartHandshake className="w-3.5 h-3.5" />
                Circular Economy & Sharing
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Share locally. Save money. Reduce planetary waste.
              </h2>
              <p className="text-emerald-100 text-sm leading-relaxed">
                Every tool, camera, textbook, or camping tent shared within your campus or neighborhood keeps useful goods in circulation and builds genuine trust.
              </p>
            </div>

            <div className="flex-shrink-0">
              <Link
                href="/resources/new"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 font-semibold text-sm shadow-md transition"
              >
                List an Item
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
