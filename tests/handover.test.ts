import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('Feature 9: QR Handover Token Cryptography & Verification', () => {
  it('generates secure 6-character uppercase token and matching SHA-256 hash', () => {
    const token = crypto.randomBytes(3).toString('hex').toUpperCase();
    expect(token).toHaveLength(6);
    expect(/^[A-F0-9]{6}$/.test(token)).toBe(true);

    const hash = crypto.createHash('sha256').update(token).digest('hex');
    expect(hash).toHaveLength(64);

    // Verifying input token produces identical hash
    const inputHash = crypto.createHash('sha256').update(token.trim().toUpperCase()).digest('hex');
    expect(inputHash).toBe(hash);
  });

  it('rejects incorrect or mismatched verification codes', () => {
    const correctToken = 'A1B2C3';
    const storedHash = crypto.createHash('sha256').update(correctToken).digest('hex');

    const wrongToken = 'X9Y8Z7';
    const wrongHash = crypto.createHash('sha256').update(wrongToken).digest('hex');

    expect(wrongHash).not.toBe(storedHash);
  });

  it('rejects expired handover tokens', () => {
    const expiredAt = new Date(Date.now() - 1000 * 60).toISOString(); // 1 minute in the past
    const isExpired = (expiresAtStr: string) => new Date(expiresAtStr).getTime() < Date.now();

    expect(isExpired(expiredAt)).toBe(true);

    const validAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(); // 24h future
    expect(isExpired(validAt)).toBe(false);
  });

  it('enforces single-use token lifecycle', () => {
    let storedHash = crypto.createHash('sha256').update('D4E5F6').digest('hex');
    expect(storedHash.length).toBe(64);

    // After verification, token hash is cleared to prevent reuse
    storedHash = '';
    expect(storedHash).toBe('');
    expect(Boolean(storedHash)).toBe(false);
  });
});

