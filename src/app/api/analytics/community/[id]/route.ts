import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/appwrite/tables';
import { Query } from '@/lib/appwrite/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const community = await dbService.getCommunityById(communityId);
    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    // 1. Active resources in this community
    const resources = await dbService.listResources([Query.equal('communityId', communityId)]);
    const activeResources = resources.filter(r => r.status === 'available' || r.status === 'borrowed' || r.status === 'reserved');

    // 2. Members
    const members = await dbService.listMembers(communityId);
    const activeMembers = members.filter(m => m.status === 'active');

    // 3. Transactions & Requests
    const requests = await dbService.listBorrowRequests([Query.equal('communityId', communityId)]);
    const completedRequests = requests.filter(r => r.status === 'completed' || r.status === 'approved');

    let freeLendingCount = 0;
    let rentalCount = 0;
    let exchangeCount = 0;
    let totalRentalVolume = 0;

    for (const req of completedRequests) {
      if (req.exchangeMode === 'free') freeLendingCount++;
      else if (req.exchangeMode === 'rent') {
        rentalCount++;
        totalRentalVolume += req.quotedTotal || 0;
      } else if (req.exchangeMode === 'exchange') {
        exchangeCount++;
      }
    }

    // Estimated savings calculation:
    // When someone borrows an item instead of buying it brand new,
    // average estimated replacement retail purchase value avoided:
    // - Free item borrow: estimated average purchase cost avoided ~ ₹1,500 per share
    // - Rental item borrow: average purchase cost avoided minus rental fee ~ ₹2,000 per share
    // - Exchange: ~ ₹1,000 per share
    const estimatedSavings = (freeLendingCount * 1500) + (rentalCount * 2000) + (exchangeCount * 1000);

    // 4. Recent activity
    const recentActivity = await dbService.listCommunityActivity(communityId, 10);

    // 5. Deterministic Impact Summary (Instant, reliable, exact)
    const impactSummary = completedRequests.length > 0
      ? `${community.name} members have completed ${completedRequests.length} sharing transactions across ${activeMembers.length} active members, avoiding an estimated ₹${estimatedSavings.toLocaleString()} in single-use purchases and reducing unnecessary consumption.`
      : `Welcome to ${community.name}! Start by listing items or borrowing from fellow members to build your community's circular sharing impact.`;

    return NextResponse.json({
      community: {
        id: community.$id,
        name: community.name,
        city: community.city,
        region: community.region,
      },
      metrics: {
        activeResources: activeResources.length,
        totalResourcesListed: resources.length,
        activeMembers: activeMembers.length,
        completedShares: completedRequests.length,
        freeLendingCount,
        rentalCount,
        exchangeCount,
        totalRentalVolume,
        estimatedSavings,
        estimationMethod: 'Based on average retail replacement cost avoided per successful borrow cycle (₹1,500 for free shares, ₹2,000 for rented items, ₹1,000 for exchanges).',
      },
      impactSummary,
      recentActivity,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Analytics error' }, { status: 500 });
  }
}

