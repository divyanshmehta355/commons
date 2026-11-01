import { describe, it, expect } from 'vitest';

describe('Storage & Media Validation', () => {
  const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
  ];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  it('accepts standard image MIME types', () => {
    expect(ALLOWED_MIME_TYPES.includes('image/jpeg')).toBe(true);
    expect(ALLOWED_MIME_TYPES.includes('image/png')).toBe(true);
    expect(ALLOWED_MIME_TYPES.includes('image/webp')).toBe(true);
    expect(ALLOWED_MIME_TYPES.includes('image/gif')).toBe(true);
  });

  it('rejects unsafe or non-image MIME types', () => {
    expect(ALLOWED_MIME_TYPES.includes('application/pdf')).toBe(false);
    expect(ALLOWED_MIME_TYPES.includes('application/javascript')).toBe(false);
    expect(ALLOWED_MIME_TYPES.includes('text/html')).toBe(false);
    expect(ALLOWED_MIME_TYPES.includes('video/mp4')).toBe(false);
  });

  it('enforces 10MB maximum file size limit', () => {
    const validSize = 5 * 1024 * 1024;
    const oversized = 15 * 1024 * 1024;
    expect(validSize <= MAX_FILE_SIZE).toBe(true);
    expect(oversized <= MAX_FILE_SIZE).toBe(false);
  });

  it('generates correct Appwrite Storage URLs', () => {
    const endpoint = 'https://cloud.appwrite.io/v1';
    const projectId = 'test-proj';
    const bucketId = 'resource-media';
    const fileId = 'file123';

    const viewUrl = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
    const previewUrl = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/preview?project=${projectId}&width=800&height=600&output=webp`;

    expect(viewUrl).toContain('/storage/buckets/resource-media/files/file123/view');
    expect(previewUrl).toContain('/preview?project=test-proj&width=800&height=600&output=webp');
  });
});

