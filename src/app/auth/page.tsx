import { createNextServerHelpers } from '@appwrite.io/react/server/next';
import { AuthPanel } from './auth-panel';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

const appwrite = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || ''
};

export default async function AuthPage() {
  const helpers = createNextServerHelpers(appwrite);
  let user = null;
  try {
    user = await helpers.getLoggedInUser();
  } catch {
    // If not logged in or session invalid
    user = null;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-stone-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6">
        <Link href="/" className="flex items-center justify-center gap-2 mb-2 group">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-sm group-hover:bg-emerald-800 transition">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-stone-900">Commons</span>
        </Link>
        <p className="text-center text-xs font-semibold text-emerald-800 uppercase tracking-widest">
          Share more. Waste less.
        </p>
      </div>

      <AuthPanel ssrUserEmail={user?.email ?? null} />
    </div>
  );
}

