import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';
import NavBar from '@/components/NavBar';

const nunito = Nunito({ 
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mimamori - Pet Care Coordination',
  description: 'Professional Pet Inventory & Care Management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
  className={`${nunito.variable} font-sans bg-background text-foreground min-h-screen flex flex-col transition-colors duration-200`}
>
        <SessionProvider>
          <NavBar />
          <main className="flex-grow">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}