import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppLayout } from '@/frontend/components/layout/AppLayout';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'XYZ College Management CRM - Admissions Portal',
  description: 'Centralized admissions pipeline, student profiles, follow-up tracking, and team analytics for XYZ College.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-slate-50 dark:bg-slate-950 min-h-screen">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
