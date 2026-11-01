import { NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { dbService } from '@/lib/appwrite/tables';
import { Query } from '@/lib/appwrite/server';

export async function GET() {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    // 1. Fetch verified reviews for this user
    const reviews = await dbService.listReviewsForUser(user.id);

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
        : null;

    // 2. Fetch completed transactions
    const lentTransactions = await dbService.listTransactions([
      Query.equal('ownerId', user.id),
      Query.equal('status', 'returned'),
      Query.limit(100),
    ]);

    const borrowedTransactions = await dbService.listTransactions([
      Query.equal('borrowerId', user.id),
      Query.equal('status', 'returned'),
      Query.limit(100),
    ]);

    const completedLendingCount = lentTransactions.length;
    const completedBorrowingCount = borrowedTransactions.length;

    // 3. Memberships count
    const memberships = await dbService.listUserMemberships(user.id);

    // 4. Compute badges
    const badges = [
      {
        id: 'first_share',
        title: 'First Share',
        description: 'Completed your first community borrowing or lending cycle.',
        earned: completedLendingCount + completedBorrowingCount >= 1,
        icon: 'Sparkles',
      },
      {
        id: 'trusted_lender',
        title: 'Trusted Lender',
        description: 'Completed 3+ resource shares with high community ratings.',
        earned: completedLendingCount >= 3 && (averageRating === null || averageRating >= 4.5),
        icon: 'ShieldCheck',
      },
      {
        id: 'community_helper',
        title: 'Community Helper',
        description: 'Active member across 2 or more campus or residential hubs.',
        earned: memberships.length >= 2,
        icon: 'HeartHandshake',
      },
      {
        id: 'top_rated',
        title: 'Top Rated',
        description: 'Achieved an average rating of 4.8 or above.',
        earned: totalReviews >= 1 && averageRating !== null && averageRating >= 4.8,
        icon: 'Award',
      },
    ];

    return NextResponse.json({
      stats: {
        completedLendingCount,
        completedBorrowingCount,
        totalShares: completedLendingCount + completedBorrowingCount,
        averageRating,
        totalReviews,
      },
      reviews,
      badges,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch profile details';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

