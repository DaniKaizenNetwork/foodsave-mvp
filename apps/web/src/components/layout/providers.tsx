'use client';

import ThemeProvider from '@/components/themes/theme-provider';
import { AuthProvider } from '@/lib/auth/auth-context';
import type { ReactNode } from 'react';
import QueryProvider from './query-provider';

/** Proveedores globales: tema claro/oscuro (next-themes), TanStack Query y sesión. */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
      <QueryProvider>
        <AuthProvider>{children}</AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
