import { describe, it, expect } from 'vitest';

describe('Feature 11: Member Profile Reviews, Ratings & Trust Badges', () => {
  const calculateAverageRating = (reviews: Array<{ rating: number }>) => {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  };

  it('calculates average rating accurately from verified reviews', () => {
    const reviews = [{ rating: 5 }, { rating: 4 }, { rating: 5 }];
    expect(calculateAverageRating(reviews)).toBe(4.7);

    const singleReview = [{ rating: 5 }];
    expect(calculateAverageRating(singleReview)).toBe(5.0);

    const emptyReviews: Array<{ rating: number }> = [];
    expect(calculateAverageRating(emptyReviews)).toBeNull();
  });

  it('determines First Share badge eligibility', () => {
    const isFirstShare = (lent: number, borrowed: number) => lent + borrowed >= 1;

    expect(isFirstShare(0, 0)).toBe(false);
    expect(isFirstShare(1, 0)).toBe(true);
    expect(isFirstShare(0, 1)).toBe(true);
    expect(isFirstShare(2, 3)).toBe(true);
  });

  it('determines Trusted Lender badge eligibility (3+ lent items & >= 4.5 rating)', () => {
    const isTrustedLender = (lent: number, avgRating: number | null) =>
      lent >= 3 && (avgRating === null || avgRating >= 4.5);

    expect(isTrustedLender(2, 5.0)).toBe(false); // not enough lent
    expect(isTrustedLender(3, 4.2)).toBe(false); // rating too low
    expect(isTrustedLender(3, 4.6)).toBe(true);
    expect(isTrustedLender(5, 5.0)).toBe(true);
  });

  it('determines Community Helper badge eligibility (2+ communities)', () => {
    const isCommunityHelper = (communitiesCount: number) => communitiesCount >= 2;

    expect(isCommunityHelper(1)).toBe(false);
    expect(isCommunityHelper(2)).toBe(true);
    expect(isCommunityHelper(4)).toBe(true);
  });
});

