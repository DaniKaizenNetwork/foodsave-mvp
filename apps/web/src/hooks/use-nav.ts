'use client';

import { useAuth } from '@/lib/auth/auth-context';
import type { NavGroup, NavItem } from '@/types';
import { useMemo } from 'react';

/**
 * Filtra el menú según el rol de la sesión (solo visibilidad en la interfaz; la API es
 * quien autoriza cada operación). Los grupos que se quedan vacíos se omiten.
 */
export function useFilteredNavGroups(groups: NavGroup[]): NavGroup[] {
  const { usuario } = useAuth();
  const rol = usuario?.rol;

  return useMemo(() => {
    const visible = (item: NavItem) => !item.access?.roles || (!!rol && item.access.roles.includes(rol));
    return groups
      .map((grupo) => ({ ...grupo, items: grupo.items.filter(visible) }))
      .filter((grupo) => grupo.items.length > 0);
  }, [groups, rol]);
}
