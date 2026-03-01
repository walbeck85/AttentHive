// src/app/pets/[id]/page.tsx
//
// Legacy route preserved for backward compatibility.  All recipient detail
// pages now live under /recipients/[id].  This redirect ensures bookmarks,
// shared links, and in-app hrefs that still point to /pets/[id] land in the
// right place without a 404.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Params =
  | { params: { id: string } }
  | { params: Promise<{ id: string }> };

export default async function PetDetailsPage({ params }: Params) {
  const resolvedParams = "then" in params ? await params : params;
  redirect(`/recipients/${resolvedParams.id}`);
}
