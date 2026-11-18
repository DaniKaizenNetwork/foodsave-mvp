'use client';

import ThemeProvider from '@/components/themes/theme-provider';
import type { ReactNode } from 'react';
import QueryProvider from './query-provider';

/** Proveedores globales: tema claro/oscuro (next-themes) y TanStack Query. */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
      <QueryProvider>{children}</QueryProvider>
    </ThemeProvider>
  );
}
