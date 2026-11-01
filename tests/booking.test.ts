import { describe, it, expect } from 'vitest';
import { hasIntervalConflict, calculateRentalDays, calculateQuotedPrice } from '../src/lib/booking/conflict';

describe('Booking Interval Conflict Detection', () => {
  it('detects overlapping intervals when existing interval overlaps requested interval', () => {
    const existing = {
      startAt: '2026-11-10T10:00:00.000Z',
      endAt: '2026-11-15T10:00:00.000Z',
    };

    // Starts during existing
    expect(hasIntervalConflict(existing, {
      startAt: '2026-11-12T10:00:00.000Z',
      endAt: '2026-11-18T10:00:00.000Z',
    })).toBe(true);

    // Encompasses existing
    expect(hasIntervalConflict(existing, {
      startAt: '2026-11-08T10:00:00.000Z',
      endAt: '2026-11-18T10:00:00.000Z',
    })).toBe(true);

    // Inside existing
    expect(hasIntervalConflict(existing, {
      startAt: '2026-11-11T10:00:00.000Z',
      endAt: '2026-11-14T10:00:00.000Z',
    })).toBe(true);
  });

  it('allows adjacent non-overlapping bookings (half-open intervals)', () => {
    const existing = {
      startAt: '2026-11-10T10:00:00.000Z',
      endAt: '2026-11-15T10:00:00.000Z',
    };

    // Ends exactly when existing starts
    expect(hasIntervalConflict(existing, {
      startAt: '2026-11-05T10:00:00.000Z',
      endAt: '2026-11-10T10:00:00.000Z',
    })).toBe(false);

    // Starts exactly when existing ends
    expect(hasIntervalConflict(existing, {
      startAt: '2026-11-15T10:00:00.000Z',
      endAt: '2026-11-20T10:00:00.000Z',
    })).toBe(false);
  });

  it('flags invalid dates as conflicts', () => {
    const existing = {
      startAt: '2026-11-10T10:00:00.000Z',
      endAt: '2026-11-15T10:00:00.000Z',
    };

    expect(hasIntervalConflict(existing, {
      startAt: 'invalid-date',
      endAt: '2026-11-20T10:00:00.000Z',
    })).toBe(true);
  });
});

describe('Rental Days Calculation', () => {
  it('calculates days between valid start and end dates', () => {
    const start = '2026-11-10T10:00:00.000Z';
    const end = '2026-11-13T10:00:00.000Z';
    expect(calculateRentalDays(start, end)).toBe(3);
  });

  it('returns at least 1 day for same-day or short borrows', () => {
    const start = '2026-11-10T10:00:00.000Z';
    const end = '2026-11-10T18:00:00.000Z';
    expect(calculateRentalDays(start, end)).toBe(1);
  });

  it('returns 0 for inverted dates', () => {
    const start = '2026-11-15T10:00:00.000Z';
    const end = '2026-11-10T10:00:00.000Z';
    expect(calculateRentalDays(start, end)).toBe(0);
  });
});

describe('Server Quoted Price Calculation', () => {
  it('quotes 0 for free lending and exchange modes', () => {
    expect(calculateQuotedPrice('free', 150, 5)).toBe(0);
    expect(calculateQuotedPrice('exchange', 200, 3)).toBe(0);
  });

  it('calculates total correctly for rent mode', () => {
    expect(calculateQuotedPrice('rent', 100, 3)).toBe(300);
    expect(calculateQuotedPrice('rent', 75.5, 2)).toBe(151);
  });
});

