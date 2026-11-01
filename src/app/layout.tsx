import type { Metadata } from "next";
import "./globals.css";
import { createNextServerHelpers } from "@appwrite.io/react/server/next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Commons — Share more. Waste less.",
  description: "A community-first resource sharing network. Lend, rent, and exchange items with your local community.",
};

const appwrite = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const helpers = createNextServerHelpers(appwrite);
  let session: string | undefined;

  try {
    session = await helpers.readSessionCookie();
  } catch {
    // ignore
  }

  if (!session) {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const projectId = appwrite.projectId;
      session =
        (projectId ? cookieStore.get(`a_session_${projectId}`)?.value : undefined) ||
        (projectId ? cookieStore.get(`a_session_${projectId}_legacy`)?.value : undefined) ||
        cookieStore.getAll().find((c) => c.name.startsWith('appwrite-session') || c.name.startsWith('a_session'))?.value;
    } catch {
      // ignore
    }
  }

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
