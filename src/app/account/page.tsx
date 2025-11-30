import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UserProfileForm from "@/components/UserProfileForm";

// Server component pulls initial data so the form feels instant and avoids a flash of loading
export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  // If someone hits this route without a session, send them through the normal auth flow
  if (!session || !session.user || !session.user.id) {
    redirect("/api/auth/signin");
  }

  const sessionUser = session.user;

  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
    },
  });

  // If we somehow have a session but no DB user, that is a bigger auth problem, so fail loudly
  if (!dbUser) {
    throw new Error("Authenticated user record not found in database.");
  }

  return (
    <main className="mx-auto max-w-2xl py-8 px-4">
      <h1 className="mb-4 text-3xl font-semibold">My profile</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {/* This keeps the copy focused on control and transparency, which is how I want this app to feel */}
        Review and update your contact details so this account stays current and actually usable.
      </p>
      <UserProfileForm
        initialName={dbUser.name ?? ""}
        initialEmail={dbUser.email ?? ""}
        initialPhone={dbUser.phone ?? ""}
        initialAddress={dbUser.address ?? ""}
      />
    </main>
  );
}