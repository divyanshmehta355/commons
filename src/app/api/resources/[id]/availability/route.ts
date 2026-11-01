import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/appwrite/tables';
import { checkBookingAvailability, calculateRentalDays, calculateQuotedPrice } from '@/lib/booking/conflict';
import { Query } from '@/lib/appwrite/server';
import { z } from 'zod';

const availabilityCheckSchema = z.object({
  startAt: z.string(),
  endAt: z.string(),
  exchangeMode: z.enum(['free', 'rent', 'exchange']).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resource = await dbService.getResourceById(id);
    if (!resource || resource.status === 'archived') {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const approvedRequests = await dbService.listBorrowRequests([
      Query.equal('resourceId', id),
      Query.equal('status', 'approved'),
    ]);

    const blackoutRules = await dbService.listAvailabilityRules(id);

    const bookedIntervals = [
      ...approvedRequests.map((r) => ({
        id: r.$id,
        startAt: r.startAt,
        endAt: r.endAt,
        type: 'booking' as const,
      })),
      ...blackoutRules.map((b) => ({
        id: b.$id,
        startAt: b.startAt,
        endAt: b.endAt,
        type: 'blackout' as const,
      })),
    ];

    return NextResponse.json({
      resourceId: id,
      status: resource.status,
      bookedIntervals,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch availability';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resource = await dbService.getResourceById(id);
    if (!resource || resource.status === 'archived') {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    if (resource.status !== 'available') {
      return NextResponse.json({
        available: false,
        conflictReason: `Resource is currently ${resource.status}.`,
      });
    }

    const body = await req.json();
    const parsed = availabilityCheckSchema.parse(body);

    const check = await checkBookingAvailability(id, parsed.startAt, parsed.endAt);
    if (!check.available) {
      return NextResponse.json(check);
    }

    const days = calculateRentalDays(parsed.startAt, parsed.endAt);
    const mode = parsed.exchangeMode || resource.exchangeMode;
    const quotedTotal = calculateQuotedPrice(mode, resource.pricePerDay || 0, days);

    return NextResponse.json({
      available: true,
      days,
      quotedTotal,
      currency: resource.currency || 'INR',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Availability check failed' }, { status: 400 });
  }
}

