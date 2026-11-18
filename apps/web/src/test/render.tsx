import { AuthProvider } from '@/lib/auth/auth-context';
import { CLAVE_SESION } from '@/lib/auth/sesion-storage';
import type { Oferta } from '@/lib/api/ofertas';
import type { Sesion, UsuarioSesion } from '@/lib/auth/tipos';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

/**
 * Auxiliar compartido de las pruebas RTL.
 *
 * Los componentes de FoodSave leen la sesión con `useAuth()` (que exige `<AuthProvider>`) y
 * consultan la API con TanStack Query (que exige `<QueryClientProvider>`). Este auxiliar
 * envuelve el componente con ambos y, si se pide, deja una sesión guardada en `localStorage`
 * ANTES de montar, que es de donde `AuthProvider` la lee.
 *
 * Lo que NO hace (a propósito): no simula `next/navigation` ni la API. Cada prueba declara sus
 * propios `vi.mock`, para que quien lea la prueba vea qué se simula y por qué.
 */
export function renderConProveedores(ui: ReactElement, opciones: { usuario?: UsuarioSesion } = {}) {
  if (opciones.usuario) {
    const sesion: Sesion = { accessToken: 'token-de-prueba', usuario: opciones.usuario };
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  }
  // `retry: false`: un error de la API se muestra de inmediato, sin reintentos que alarguen la prueba.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{ui}</AuthProvider>
    </QueryClientProvider>
  );
}

export const CONSUMIDOR: UsuarioSesion = { id: 'u-consumidor', nombre: 'Consumidor Uno', rol: 'CONSUMIDOR' };

/** Oferta completa con la forma real de la API; cada prueba cambia solo lo que le interesa. */
export function ofertaDePrueba(cambios: Partial<Oferta> = {}): Oferta {
  return {
    id: 'oferta-1',
    sedeId: 'sede-centro',
    sede: { id: 'sede-centro', nombre: 'Sede Centro' },
    producto: 'Pan integral',
    precioOriginal: 8000,
    precioOferta: 4000,
    cantidad: 5,
    disponible: 5,
    vencimiento: '2030-01-01T17:00:00.000Z',
    estado: 'ACTIVA',
    createdAt: '2026-11-18T12:00:00.000Z',
    ...cambios
  };
}
