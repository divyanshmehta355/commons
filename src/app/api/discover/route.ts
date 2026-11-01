import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/appwrite/tables';
import { getAuthUser } from '@/lib/permissions/auth-guard';
import { calculateDistanceKm, formatDistance, resolveApproximateLocation } from '@/lib/geo/spatial';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').toLowerCase().trim();
    const category = searchParams.get('category');
    const mode = searchParams.get('mode');
    const condition = searchParams.get('condition');
    const communityId = searchParams.get('communityId');
    const onlyAvailable = searchParams.get('available') !== 'false';

    // Geo-spatial query params
    const userLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const userLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;
    const radiusKm = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : null;
    const sortBy = searchParams.get('sort') || 'newest';

    const hasUserLocation = userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng);
    const userCoords: [number, number] | null = hasUserLocation ? [userLng!, userLat!] : null;

    const currentUser = await getAuthUser();

    // Fetch all active communities
    const communities = await dbService.listCommunities();
    const communityMap = new Map(communities.map(c => [c.$id, c]));

    // Fetch user memberships if signed in
    let userCommunityIds = new Set<string>();
    if (currentUser) {
      const memberships = await dbService.listUserMemberships(currentUser.id);
      userCommunityIds = new Set(memberships.map(m => m.communityId));
    }

    // Fetch resources
    const allResources = await dbService.listResources();

    const filtered = allResources.filter(r => {
      if (r.status === 'archived') return false;
      if (onlyAvailable && r.status !== 'available') return false;

      const community = communityMap.get(r.communityId);
      if (!community || community.status === 'archived') return false;

      // Visibility filter:
      // A resource is visible if:
      // 1. User is member of the community, OR
      // 2. Resource has allowCrossCommunity = true AND community is public
      const isMember = userCommunityIds.has(r.communityId);
      const isCrossAllowed = r.allowCrossCommunity && community.visibility === 'public';
      if (!isMember && !isCrossAllowed) {
        return false;
      }

      // Filter by communityId if requested
      if (communityId && r.communityId !== communityId) {
        return false;
      }

      // Filter by category
      if (category && category !== 'All' && r.category !== category) {
        return false;
      }

      // Filter by sharing mode
      if (mode && mode !== 'All') {
        if (mode === 'free' && r.exchangeMode !== 'free' && r.exchangeMode !== 'both') return false;
        if (mode === 'rent' && r.exchangeMode !== 'rent' && r.exchangeMode !== 'both') return false;
        if (mode === 'exchange' && r.exchangeMode !== 'exchange') return false;
      }

      // Filter by condition
      if (condition && condition !== 'All' && r.condition !== condition) {
        return false;
      }

      // Text search
      if (q) {
        const titleMatch = r.title.toLowerCase().includes(q);
        const descMatch = (r.description || '').toLowerCase().includes(q);
        const catMatch = r.category.toLowerCase().includes(q);
        const areaMatch = (r.pickupArea || '').toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !catMatch && !areaMatch) {
          return false;
        }
      }

      return true;
    });

    const enriched = filtered.map(r => {
      const comm = communityMap.get(r.communityId);
      const isMember = userCommunityIds.has(r.communityId);

      // Determine item location (from point column or approximate pickup area / city)
      const itemLocation: [number, number] | null =
        r.location && Array.isArray(r.location) && r.location.length === 2
          ? (r.location as [number, number])
          : resolveApproximateLocation(r.pickupArea || comm?.city || '');

      let distanceKm: number | null = null;
      let distanceFormatted: string | null = null;

      if (userCoords && itemLocation) {
        distanceKm = calculateDistanceKm(userCoords, itemLocation);
        distanceFormatted = formatDistance(distanceKm);
      }

      return {
        ...r,
        location: itemLocation,
        distanceKm,
        distanceFormatted,
        communityName: comm?.name || 'Local Community',
        communityCity: comm?.city || '',
        communityRegion: comm?.region || '',
        isUserMember: isMember,
      };
    });

    // Apply radius filter if specified and user location is available
    let results = enriched;
    if (userCoords && radiusKm && !isNaN(radiusKm)) {
      results = results.filter(r => r.distanceKm !== null && r.distanceKm <= radiusKm);
    }

    // Apply sorting
    if (sortBy === 'nearest' && userCoords) {
      results.sort((a, b) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    return NextResponse.json({
      resources: results,
      total: results.length,
      userLocation: userCoords ? { lon: userCoords[0], lat: userCoords[1] } : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Discovery search failed' }, { status: 500 });
  }
}

