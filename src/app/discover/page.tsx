'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';
import { ResourceMap } from '@/components/geo/ResourceMap';
import {
  Search,
  Filter,
  Tag,
  Building2,
  MapPin,
  Calendar,
  Loader2,
  SlidersHorizontal,
  CheckCircle2,
  ArrowRight,
  Navigation,
  Map,
  LayoutGrid,
  LocateFixed,
  AlertCircle
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Electronics',
  'Books',
  'Study materials',
  'Sports equipment',
  'Tools',
  'Furniture',
  'Kitchen appliances',
  'Clothing',
  'Travel equipment',
  'Event supplies',
  'Other',
];

const MODES = [
  { label: 'All Modes', value: 'All' },
  { label: 'Free Lending', value: 'free' },
  { label: 'Rental', value: 'rent' },
  { label: 'Exchange', value: 'exchange' },
];

const RADIUS_OPTIONS = [
  { label: 'All Distances', value: 'all' },
  { label: '< 2 km (Walking)', value: '2' },
  { label: '< 5 km (Cycling)', value: '5' },
  { label: '< 10 km (Quick drive)', value: '10' },
  { label: '< 25 km (City-wide)', value: '25' },
];

export default function DiscoverPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMode, setSelectedMode] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');

  // Geo-Spatial state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedRadius, setSelectedRadius] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'nearest'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const fetchResources = async (
    query = searchQuery,
    cat = selectedCategory,
    mode = selectedMode,
    cond = selectedCondition,
    coords = userLocation,
    radius = selectedRadius,
    sort = sortBy
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (cat !== 'All') params.set('category', cat);
      if (mode !== 'All') params.set('mode', mode);
      if (cond !== 'All') params.set('condition', cond);
      if (coords) {
        params.set('lat', coords.lat.toString());
        params.set('lng', coords.lng.toString());
      }
      if (radius !== 'all') {
        params.set('radius', radius);
      }
      if (sort) {
        params.set('sort', sort);
      }

      const res = await fetch(`/api/discover?${params.toString()}`);
      const data = await res.json();
      if (data.resources) {
        setResources(data.resources);
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources(searchQuery, selectedCategory, selectedMode, selectedCondition, userLocation, selectedRadius, sortBy);
  }, [selectedCategory, selectedMode, selectedCondition, selectedRadius, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResources(searchQuery, selectedCategory, selectedMode, selectedCondition, userLocation, selectedRadius, sortBy);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setSortBy('nearest');
        setLocating(false);
        fetchResources(searchQuery, selectedCategory, selectedMode, selectedCondition, coords, selectedRadius, 'nearest');
      },
      (err) => {
        setLocating(false);
        setLocationError(err.message || 'Unable to retrieve location.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleClearLocation = () => {
    setUserLocation(null);
    setSelectedRadius('all');
    setSortBy('newest');
    fetchResources(searchQuery, selectedCategory, selectedMode, selectedCondition, null, 'all', 'newest');
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedMode('All');
    setSelectedCondition('All');
    setSelectedRadius('all');
    setSortBy('newest');
    fetchResources('', 'All', 'All', 'All', userLocation, 'all', 'newest');
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Discover Resources</h1>
            <p className="text-sm text-stone-600 mt-1">
              Find items shared by neighbors in your area, residence, or local community.
            </p>
          </div>

          {/* View Mode Toggle: Grid vs Map */}
          <div className="flex items-center rounded-xl bg-stone-200/70 p-1 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
                viewMode === 'grid'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
                viewMode === 'map'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              Map
            </button>
          </div>
        </div>

        {/* Search & Location Filter Bar */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs mb-8 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by item name, description, or pickup area..."
                className="w-full pl-11 pr-4 py-3 text-sm text-stone-900 bg-white placeholder:text-stone-500 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition"
              />
            </div>

            <div className="flex gap-2">
              {/* Near Me Geo Button */}
              {userLocation ? (
                <button
                  type="button"
                  onClick={handleClearLocation}
                  className="px-3.5 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-100 transition whitespace-nowrap"
                  title="Click to clear location"
                >
                  <LocateFixed className="w-4 h-4 text-emerald-700" />
                  <span>Near Me Active (×)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locating}
                  className="px-4 py-3 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap disabled:opacity-50"
                >
                  {locating ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                  ) : (
                    <Navigation className="w-4 h-4 text-emerald-700" />
                  )}
                  <span>{locating ? 'Locating...' : 'Near Me'}</span>
                </button>
              )}

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm transition shadow-xs flex items-center justify-center gap-2"
              >
                Search
              </button>

              {(searchQuery || selectedCategory !== 'All' || selectedMode !== 'All' || selectedRadius !== 'all' || userLocation) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-medium text-sm transition"
                >
                  Reset
                </button>
              )}
            </div>
          </form>

          {locationError && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{locationError}</span>
            </div>
          )}

          {/* Geo Distance & Sorting Controls */}
          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Radius filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-stone-500">Radius:</span>
                <select
                  value={selectedRadius}
                  onChange={(e) => setSelectedRadius(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  {RADIUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-stone-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="newest">Newest First</option>
                  <option value="nearest" disabled={!userLocation}>
                    Nearest First {!userLocation && '(enable Near Me)'}
                  </option>
                </select>
              </div>
            </div>

            {/* Mode filter pills */}
            <div className="flex items-center gap-1">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setSelectedMode(m.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    selectedMode === m.value
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pt-1">
            <span className="text-xs font-semibold text-stone-500 mr-1">Categories:</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-stone-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-3" />
            <p className="text-sm font-medium">Discovering community resources...</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-1">No resources found</h3>
            <p className="text-xs text-stone-500 mb-6 leading-relaxed">
              {selectedRadius !== 'all'
                ? `No items found within your selected radius. Try expanding the radius or clearing filters.`
                : `Try adjusting your search keywords, clearing filters, or list the first item in your community!`}
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition shadow-xs"
            >
              Clear Filters
            </button>
          </div>
        ) : viewMode === 'map' ? (
          /* Interactive Map View */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-stone-600 px-1">
              <span>Showing <strong>{resources.length}</strong> items across your local communities</span>
              <span className="text-[11px] text-stone-500">*Coordinates represent approximate neighborhood centroids for member privacy</span>
            </div>
            <ResourceMap resources={resources} userLocation={userLocation} />
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((item) => (
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

                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-xs text-[11px] font-semibold text-stone-800 shadow-xs">
                    {item.category}
                  </span>

                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-emerald-700 text-white text-[11px] font-semibold shadow-xs">
                    {item.exchangeMode === 'free'
                      ? 'Free Lending'
                      : item.exchangeMode === 'rent'
                      ? `₹${item.pricePerDay}/day`
                      : item.exchangeMode === 'both'
                      ? `Free or ₹${item.pricePerDay}/day`
                      : 'Exchange'}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-800 truncate">
                        <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{item.communityName}</span>
                      </div>

                      {/* Distance Badge */}
                      {item.distanceFormatted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold flex-shrink-0">
                          <MapPin className="w-3 h-3 text-emerald-700" />
                          {item.distanceFormatted}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-stone-900 text-base group-hover:text-emerald-700 transition line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-stone-600 text-xs mt-1 line-clamp-2 leading-relaxed">
                      {item.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-700">
                    <span className="capitalize font-medium">Condition: <strong className="text-stone-900 font-bold">{item.condition}</strong></span>
                    {item.pickupArea ? (
                      <span className="flex items-center gap-1 text-stone-600 font-medium max-w-[130px] truncate">
                        <MapPin className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
                        <span className="truncate">{item.pickupArea}</span>
                      </span>
                    ) : item.communityCity ? (
                      <span className="flex items-center gap-1 text-stone-600 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
                        <span>{item.communityCity}</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
