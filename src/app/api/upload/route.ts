import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/permissions/auth-guard';
import { getAdminClient, appwriteConfig, ID, Permission, Role } from '@/lib/appwrite/server';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

export async function POST(request: NextRequest) {
  const auth = await requireAuthUser();
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided or invalid file format.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${file.type}. Allowed formats: JPG, PNG, WebP, GIF, AVIF.`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit.' },
        { status: 400 }
      );
    }

    const { storage, bucketId } = getAdminClient();
    const fileId = ID.unique();

    const uploaded = await storage.createFile(
      bucketId,
      fileId,
      file,
      [
        Permission.read(Role.any()),
        Permission.delete(Role.user(auth.user.id)),
      ]
    );

    const baseUrl = `${appwriteConfig.endpoint}/storage/buckets/${bucketId}/files/${uploaded.$id}`;
    const viewUrl = `${baseUrl}/view?project=${appwriteConfig.projectId}`;
    const previewUrl = `${baseUrl}/preview?project=${appwriteConfig.projectId}&width=800&height=600&output=webp`;

    return NextResponse.json({
      success: true,
      fileId: uploaded.$id,
      name: uploaded.name,
      size: uploaded.sizeOriginal,
      mimeType: uploaded.mimeType,
      url: viewUrl,
      previewUrl,
    });
  } catch (err: any) {
    console.error('File upload error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to upload image to Appwrite Storage.' },
      { status: 500 }
    );
  }
}

