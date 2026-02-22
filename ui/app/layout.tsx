import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Innocenti & Associates | EU AI Act Compliance Search',
  description: 'Enterprise-grade semantic search for EU AI Act compliance with AI-powered precision analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen scrollbar-dark">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
