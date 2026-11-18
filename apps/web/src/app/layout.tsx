import Providers from '@/components/layout/providers';
import { Toaster } from '@/components/ui/sonner';
import { fontVariables } from '@/components/themes/font.config';
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'FoodSave',
    template: '%s | FoodSave'
  },
  description:
    'Publica y reserva productos próximos a vencer con descuento. Paga y recoge en la sede.'
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#14683B' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1712' }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='es' suppressHydrationWarning className={cn(fontVariables)}>
      <body className='bg-background text-foreground overflow-x-hidden overscroll-none font-sans antialiased'>
        <NuqsAdapter>
          <Providers>
            <Toaster />
            {children}
          </Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}
