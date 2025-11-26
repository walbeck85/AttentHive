// src/app/layout.tsx
import "./globals.css";
import { Nunito } from "next/font/google";
import Providers from "./providers";
import NavBar from "@/components/NavBar";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata = {
  title: "Mimamori",
  description: "Care coordination for pets, people, and plants",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} font-sans bg-mm-cream min-h-screen`}>
        <Providers>
          {/* Sticky global nav */}
          <NavBar />

          {/* Page content */}
          <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}