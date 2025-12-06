// src/app/(auth)/signup/page.tsx
import SignupPageClient from "./SignupPageClient";
import { getSafeCallbackUrl } from "@/lib/authRedirect";

type SignupPageProps = {
  searchParams?: {
    callbackUrl?: string;
  };
};

// Server wrapper for signup:
// - Receives searchParams from Next.js
// - Normalizes callbackUrl
// - Delegates to the client component for auth logic + UI
export default function SignupPage({ searchParams }: SignupPageProps) {
  const rawCallback = searchParams?.callbackUrl ?? null;
  const safeCallbackUrl = getSafeCallbackUrl(rawCallback);

  return (
    <SignupPageClient
      rawCallback={rawCallback}
      safeCallbackUrl={safeCallbackUrl}
    />
  );
}