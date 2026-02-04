import type { Metadata } from 'next';
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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 scrollbar-dark">
        {children}
      </body>
    </html>
  );
}
