// app/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // 👈 adjust this import if needed

export default async function HomePage() {
  // Get the current session on the server
  const session = await getServerSession(authOptions);

  if (session?.user) {
    // Logged in → go straight to dashboard
    redirect("/dashboard");
  }

  // Not logged in → go to login
  redirect("/login");
}