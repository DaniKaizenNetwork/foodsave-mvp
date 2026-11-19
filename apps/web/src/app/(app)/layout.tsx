import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { cookies } from 'next/headers';
import type { CSSProperties } from 'react';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // El estado del sidebar se recuerda en una cookie; sin cookie arranca abierto.
  const cookieStore = await cookies();
  const guardado = cookieStore.get('sidebar_state')?.value;
  const defaultOpen = guardado === undefined ? true : guardado === 'true';

  return (
    // Cascarón de altura fija: el sidebar va sobre el lienzo --sidebar y la página es un
    // panel con un único scroll. El riel de 2.375rem deja 12px a cada lado de los iconos de 32px.
    <SidebarProvider
      defaultOpen={defaultOpen}
      className='h-dvh'
      style={{ '--sidebar-width-icon': '2.375rem' } as CSSProperties}
    >
      <a
        href='#main-content'
        className='bg-background ring-ring sr-only rounded-md px-3 py-2 text-sm font-medium shadow focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-50 focus:ring-2'
      >
        Saltar al contenido
      </a>
      <AppSidebar />
      <SidebarInset
        id='main-content'
        tabIndex={-1}
        className='md:ring-foreground/10 min-h-0 min-w-0 overflow-hidden outline-none md:ring-1'
      >
        <Header />
        <div
          data-slot='page-scroller'
          className='flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto'
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
