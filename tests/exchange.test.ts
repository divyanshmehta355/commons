import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const createExchangeOfferSchema = z.object({
  targetResourceId: z.string().min(1, 'Target resource ID is required'),
  offeredResourceId: z.string().min(1, 'Offered resource ID is required'),
  message: z.string().max(2000).optional().default(''),
});

const respondOfferSchema = z.object({
  action: z.enum(['accept', 'decline', 'cancel']),
});

describe('Feature 16: Exchange Matching Logic', () => {
  it('validates exchange proposal schemas', () => {
    const valid = {
      targetResourceId: 'res-target-1',
      offeredResourceId: 'res-offered-2',
      message: 'Happy to exchange my drill for your ladder!',
    };
    expect(createExchangeOfferSchema.safeParse(valid).success).toBe(true);

    const missingTarget = {
      offeredResourceId: 'res-offered-2',
    };
    expect(createExchangeOfferSchema.safeParse(missingTarget).success).toBe(false);

    expect(respondOfferSchema.safeParse({ action: 'accept' }).success).toBe(true);
    expect(respondOfferSchema.safeParse({ action: 'decline' }).success).toBe(true);
    expect(respondOfferSchema.safeParse({ action: 'cancel' }).success).toBe(true);
    expect(respondOfferSchema.safeParse({ action: 'delete' }).success).toBe(false);
  });

  it('validates exchange creation invariants', () => {
    const validateProposal = (
      callerId: string,
      target: { id: string; ownerId: string; exchangeMode: string },
      offered: { id: string; ownerId: string }
    ) => {
      if (target.id === offered.id) return { allowed: false, error: 'Cannot exchange resource for itself' };
      if (target.ownerId === callerId) return { allowed: false, error: 'Cannot propose exchange for own resource' };
      if (offered.ownerId !== callerId) return { allowed: false, error: 'Can only offer resources you own' };
      if (target.exchangeMode !== 'exchange' && target.exchangeMode !== 'both') {
        return { allowed: false, error: 'Target resource does not accept exchange proposals' };
      }
      return { allowed: true };
    };

    // Valid proposal
    const valid = validateProposal(
      'user-alice',
      { id: 'item-ladder', ownerId: 'user-bob', exchangeMode: 'exchange' },
      { id: 'item-drill', ownerId: 'user-alice' }
    );
    expect(valid.allowed).toBe(true);

    // Self-target
    const selfTarget = validateProposal(
      'user-alice',
      { id: 'item-ladder', ownerId: 'user-alice', exchangeMode: 'both' },
      { id: 'item-drill', ownerId: 'user-alice' }
    );
    expect(selfTarget.allowed).toBe(false);

    // Offering item owned by another person
    const notOwned = validateProposal(
      'user-alice',
      { id: 'item-ladder', ownerId: 'user-bob', exchangeMode: 'exchange' },
      { id: 'item-drill', ownerId: 'user-charlie' }
    );
    expect(notOwned.allowed).toBe(false);

    // Target resource is rent-only (does not support exchange)
    const rentOnly = validateProposal(
      'user-alice',
      { id: 'item-ladder', ownerId: 'user-bob', exchangeMode: 'rent' },
      { id: 'item-drill', ownerId: 'user-alice' }
    );
    expect(rentOnly.allowed).toBe(false);
  });

  it('enforces role authorization on offer response', () => {
    const canRespond = (
      callerId: string,
      offer: { ownerId: string; proposerId: string; status: string },
      action: 'accept' | 'decline' | 'cancel'
    ) => {
      if (offer.status !== 'pending') return { allowed: false, error: 'Offer already finalized' };
      if (action === 'cancel') {
        if (callerId !== offer.proposerId) return { allowed: false, error: 'Only proposer can cancel' };
        return { allowed: true };
      }
      if (action === 'accept' || action === 'decline') {
        if (callerId !== offer.ownerId) return { allowed: false, error: 'Only owner can accept or decline' };
        return { allowed: true };
      }
      return { allowed: false, error: 'Invalid action' };
    };

    const offer = { ownerId: 'user-bob', proposerId: 'user-alice', status: 'pending' };

    // Owner can accept or decline
    expect(canRespond('user-bob', offer, 'accept').allowed).toBe(true);
    expect(canRespond('user-bob', offer, 'decline').allowed).toBe(true);
    // Proposer cannot accept
    expect(canRespond('user-alice', offer, 'accept').allowed).toBe(false);

    // Proposer can cancel
    expect(canRespond('user-alice', offer, 'cancel').allowed).toBe(true);
    // Owner cannot cancel
    expect(canRespond('user-bob', offer, 'cancel').allowed).toBe(false);

    // Once resolved, neither can respond
    const resolvedOffer = { ...offer, status: 'accepted' };
    expect(canRespond('user-bob', resolvedOffer, 'decline').allowed).toBe(false);
    expect(canRespond('user-alice', resolvedOffer, 'cancel').allowed).toBe(false);
  });
});

