import type { NavGroup } from '@/types';

/**
 * Menú del sidebar. Un ítem con `access.roles` solo lo ven esos roles; sin `access`
 * lo ve todo el mundo (incluidos los visitantes). La autorización real la hace la API.
 */
export const navGroups: NavGroup[] = [
  {
    label: 'Ofertas',
    items: [
      { title: 'Ofertas', url: '/ofertas', icon: 'offer', isActive: false, items: [] },
      {
        title: 'Publicar oferta',
        url: '/ofertas/nueva',
        icon: 'add',
        isActive: false,
        items: [],
        access: { roles: ['DUENO', 'PERSONAL'] }
      }
    ]
  },
  {
    label: 'Reservas',
    items: [
      {
        title: 'Mis reservas',
        url: '/reservas',
        icon: 'reservation',
        isActive: false,
        items: [],
        access: { roles: ['CONSUMIDOR'] }
      },
      {
        title: 'Reservas de la sede',
        url: '/gestion/reservas',
        icon: 'store',
        isActive: false,
        items: [],
        access: { roles: ['DUENO', 'PERSONAL'] }
      }
    ]
  }
];
