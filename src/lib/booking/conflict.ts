export interface BookingInterval {
  startAt: string;
  endAt: string;
}

/**
 * Half-open interval conflict check:
 * existing.startAt < requested.endAt && existing.endAt > requested.startAt
 */
export function hasIntervalConflict(
  existing: BookingInterval,
  requested: BookingInterval
): boolean {
  const existingStart = new Date(existing.startAt).getTime();
  const existingEnd = new Date(existing.endAt).getTime();
  const requestedStart = new Date(requested.startAt).getTime();
  const requestedEnd = new Date(requested.endAt).getTime();

  if (isNaN(existingStart) || isNaN(existingEnd) || isNaN(requestedStart) || isNaN(requestedEnd)) {
    return true; // invalid dates count as conflict
  }

  return existingStart < requestedEnd && existingEnd > requestedStart;
}

export function calculateRentalDays(startAt: string, endAt: string): number {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) {
    return 0;
  }
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

export function calculateQuotedPrice(
  exchangeMode: string,
  pricePerDay: number,
  days: number
): number {
  if (exchangeMode === 'free' || exchangeMode === 'exchange') {
    return 0;
  }
  return Number((Math.max(0, pricePerDay) * Math.max(1, days)).toFixed(2));
}

/**
 * Checks if a resource has an overlapping approved booking
 */
export async function checkBookingAvailability(
  resourceId: string,
  startAt: string,
  endAt: string,
  excludeRequestId?: string
): Promise<{ available: boolean; conflictReason?: string }> {
  const requestedStart = new Date(startAt).getTime();
  const requestedEnd = new Date(endAt).getTime();

  if (isNaN(requestedStart) || isNaN(requestedEnd)) {
    return { available: false, conflictReason: 'Invalid start or end date.' };
  }

  if (requestedEnd <= requestedStart) {
    return { available: false, conflictReason: 'End date must be after start date.' };
  }

  // Dynamic import to prevent next/headers from polluting pure unit test environments
  const { dbService } = await import('../appwrite/tables');
  const { Query } = await import('../appwrite/server');

  // Fetch approved requests for this resource
  const existingRequests = await dbService.listBorrowRequests([
    Query.equal('resourceId', resourceId),
    Query.equal('status', 'approved'),
  ]);

  for (const req of existingRequests) {
    if (excludeRequestId && req.$id === excludeRequestId) {
      continue;
    }
    if (hasIntervalConflict({ startAt: req.startAt, endAt: req.endAt }, { startAt, endAt })) {
      return {
        available: false,
        conflictReason: `Resource is already booked from ${req.startAt.slice(0, 10)} to ${req.endAt.slice(0, 10)}.`,
      };
    }
  }

  // Fetch blackout rules for this resource
  const rules = await dbService.listAvailabilityRules(resourceId);
  for (const rule of rules) {
    if (hasIntervalConflict({ startAt: rule.startAt, endAt: rule.endAt }, { startAt, endAt })) {
      return {
        available: false,
        conflictReason: `Resource is unavailable from ${rule.startAt.slice(0, 10)} to ${rule.endAt.slice(0, 10)} (Owner Blackout).`,
      };
    }
  }

  return { available: true };
}
