import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { dbService } from '@/lib/appwrite/tables';
import crypto from 'crypto';
import QRCode from 'qrcode';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const { id } = await params;
    const transaction = await dbService.getTransactionById(id);
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.ownerId !== user.id && transaction.borrowerId !== user.id) {
      return NextResponse.json({ error: 'Only transaction participants can access handover token.' }, { status: 403 });
    }

    if (transaction.status !== 'awaiting_handover') {
      return NextResponse.json({
        status: transaction.status,
        message: `Transaction is in "${transaction.status}" status.`,
      });
    }

    // Generate fresh cryptographically secure 6-character alphanumeric token
    const token = crypto.randomBytes(3).toString('hex').toUpperCase();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    await dbService.updateTransaction(id, {
      handoverTokenHash: tokenHash,
      handoverExpiresAt: expiresAt,
    });

    const qrPayload = JSON.stringify({
      transactionId: id,
      token,
      resourceId: transaction.resourceId,
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      margin: 2,
      width: 256,
      color: {
        dark: '#064e3b',
        light: '#ffffff',
      },
    });

    return NextResponse.json({
      token,
      expiresAt,
      qrDataUrl,
      isOwner: transaction.ownerId === user.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate handover token';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;
  const user = auth.user;

  try {
    const { id } = await params;
    const transaction = await dbService.getTransactionById(id);
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.ownerId !== user.id && transaction.borrowerId !== user.id) {
      return NextResponse.json({ error: 'Only transaction participants can confirm handover.' }, { status: 403 });
    }

    if (transaction.status !== 'awaiting_handover') {
      return NextResponse.json({ error: `Handover cannot be confirmed for status "${transaction.status}".` }, { status: 400 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body allowed for fallback manual confirmation
    }

    const isOwner = transaction.ownerId === user.id;

    // Check token-based handover verification
    if (body?.token) {
      const providedToken = String(body.token).trim().toUpperCase();

      if (!transaction.handoverTokenHash || !transaction.handoverExpiresAt) {
        return NextResponse.json(
          { error: 'No active handover token found. Please ask the owner to view the handover code.' },
          { status: 400 }
        );
      }

      if (new Date(transaction.handoverExpiresAt).getTime() < Date.now()) {
        return NextResponse.json(
          { error: 'Handover token has expired. Please refresh the code.' },
          { status: 400 }
        );
      }

      const inputHash = crypto.createHash('sha256').update(providedToken).digest('hex');
      if (inputHash !== transaction.handoverTokenHash) {
        return NextResponse.json(
          { error: 'Invalid handover verification code. Please check and try again.' },
          { status: 400 }
        );
      }

      // Valid token matches! Single-use token enforcement & complete handover immediately
      const handoverAt = new Date().toISOString();
      const updated = await dbService.updateTransaction(id, {
        ownerConfirmed: true,
        borrowerConfirmed: true,
        status: 'borrowed',
        handoverAt,
        handoverTokenHash: '', // Clear token to enforce single-use
      });

      await dbService.updateResource(transaction.resourceId, {
        status: 'borrowed',
        updatedAt: handoverAt,
      });

      const request = await dbService.getBorrowRequestById(transaction.requestId);
      if (request) {
        await dbService.logActivity({
          communityId: request.communityId,
          actorId: user.id,
          entityType: 'transaction',
          entityId: transaction.$id,
          action: 'handover_verified_with_token',
          metadata: JSON.stringify({ verifiedBy: isOwner ? 'owner' : 'borrower' }),
          createdAt: handoverAt,
        });
      }

      // Notify the other party
      const notifyPartnerId = isOwner ? transaction.borrowerId : transaction.ownerId;
      await dbService.createNotification({
        userId: notifyPartnerId,
        title: 'Handover Verified & Active',
        message: `Handover has been cryptographically verified. The sharing period is now active!`,
        type: 'handover_verified',
        link: `/transactions/${transaction.$id}`,
        isRead: false,
        createdAt: handoverAt,
      });

      return NextResponse.json({
        message: 'Handover verified and completed! The item is now actively borrowed.',
        transaction: updated,
      });
    }

    // Fallback: Manual confirmation without token
    const ownerConfirmed = isOwner ? true : transaction.ownerConfirmed;
    const borrowerConfirmed = !isOwner ? true : transaction.borrowerConfirmed;
    const bothConfirmed = ownerConfirmed && borrowerConfirmed;
    const newStatus = bothConfirmed ? 'borrowed' : 'awaiting_handover';
    const handoverAt = bothConfirmed ? new Date().toISOString() : transaction.handoverAt || new Date().toISOString();

    const updated = await dbService.updateTransaction(id, {
      ownerConfirmed,
      borrowerConfirmed,
      status: newStatus,
      handoverAt,
    });

    if (bothConfirmed) {
      await dbService.updateResource(transaction.resourceId, {
        status: 'borrowed',
        updatedAt: new Date().toISOString(),
      });
    }

    const request = await dbService.getBorrowRequestById(transaction.requestId);
    if (request) {
      await dbService.logActivity({
        communityId: request.communityId,
        actorId: user.id,
        entityType: 'transaction',
        entityId: transaction.$id,
        action: bothConfirmed ? 'handover_completed' : (isOwner ? 'owner_handed_over' : 'borrower_received'),
        metadata: JSON.stringify({ status: newStatus }),
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      message: bothConfirmed
        ? 'Handover completed! Item is now actively borrowed.'
        : 'Handover confirmed. Waiting for the other party.',
      transaction: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Handover confirmation failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
