// src/app/layout.tsx
import "./globals.css";
import { Nunito } from "next/font/google";
import Providers from "./providers";
import NavBar from "@/components/NavBar";

// Font setup ---------------------------------------------------
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

// Metadata -----------------------------------------------------
export const metadata = {
  title: "Mimamori",
  description: "Care coordination for pets, people, and plants",
};

// Layout -------------------------------------------------------
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* Body background and text color are controlled in globals.css via CSS variables */}
      <body className={`${nunito.variable} font-sans min-h-screen`}>
        <Providers>
          {/* Sticky global nav */}
          <NavBar />

          {/* Page content – individual pages use .mm-page / .mm-shell for layout */}
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}