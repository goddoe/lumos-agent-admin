import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lumos Agent Admin Dashboard',
  description: 'Dashboard for monitoring Lumos Agent automation rates',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold tracking-tight">
                  Lumos Agent Admin
                </h1>
              </div>
            </div>
          </header>
          
          <div className="container mx-auto px-4 py-6">
            <Navigation />
          </div>
          
          <main className="flex-1 container mx-auto px-4 pb-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}