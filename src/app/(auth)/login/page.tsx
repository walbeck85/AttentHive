// src/app/(auth)/login/page.tsx
import LoginPageClient from "./LoginPageClient";
import { getSafeCallbackUrl } from "@/lib/authRedirect";

type LoginPageProps = {
  searchParams?: {
    callbackUrl?: string;
  };
};

// Server component wrapper:
// - Receives searchParams from Next.js at request time.
// - Normalizes callbackUrl once using getSafeCallbackUrl.
// - Hands rawCallback and safeCallbackUrl down to the client component.
export default function LoginPage({ searchParams }: LoginPageProps) {
  const rawCallback = searchParams?.callbackUrl ?? null;
  const safeCallbackUrl = getSafeCallbackUrl(rawCallback);

  return (
    <LoginPageClient
      rawCallback={rawCallback}
      safeCallbackUrl={safeCallbackUrl}
    />
  );
}