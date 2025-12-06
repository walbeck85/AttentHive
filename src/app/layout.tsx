// src/app/layout.tsx
import "./globals.css";
import { Nunito } from "next/font/google";
import Providers from "./providers";
import RootShell from "@/components/RootShell";
import MuiCacheProvider from "@/components/MuiCacheProvider";

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
      {/* Body background and text color are controlled in globals.css via CSS variables */}
      <body className={`${nunito.variable} font-sans min-h-screen`}>
        <MuiCacheProvider>
          <Providers>
            {/* App shell: sticky MUI AppBar + responsive drawer + content shift */}
            <RootShell>{children}</RootShell>
          </Providers>
        </MuiCacheProvider>
      </body>
    </html>
  );
}
