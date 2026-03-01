// src/app/recipients/[id]/activity/page.tsx
//
// The full activity log is now displayed inline on the recipient detail
// page (Phase 3).  This route exists so any links pointing to
// /recipients/[id]/activity still work by redirecting to the detail page.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Params =
  | { params: { id: string } }
  | { params: Promise<{ id: string }> };

export default async function RecipientActivityPage({ params }: Params) {
  const resolvedParams = "then" in params ? await params : params;
  redirect(`/recipients/${resolvedParams.id}`);
}
