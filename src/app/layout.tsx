import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import OcpLogo from './ocplogo.png';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'SafeSteps',
  description: 'Gestion des postes, standards et formulaires pour la sécurité',
  icons: [{ rel: 'icon', url: OcpLogo.src }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 font-sans antialiased",
        fontSans.variable
      )}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
