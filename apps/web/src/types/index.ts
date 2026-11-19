import { Icons } from '@/components/icons';

/** Roles de FoodSave (los entrega la API en el login). */
export type Rol = 'CONSUMIDOR' | 'PERSONAL' | 'DUENO' | 'ADMIN';

/** Un ítem del menú solo se muestra a los roles indicados (si no hay `roles`, a todos los autenticados). */
export interface PermissionCheck {
  roles?: Rol[];
}

export interface NavItem {
  title: string;
  url: string;
  disabled?: boolean;
  external?: boolean;
  shortcut?: [string, string];
  icon?: keyof typeof Icons;
  label?: string;
  description?: string;
  isActive?: boolean;
  items?: NavItem[];
  access?: PermissionCheck;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

export interface NavItemWithOptionalChildren extends NavItem {
  items?: NavItemWithChildren[];
}

export interface FooterItem {
  title: string;
  items: {
    title: string;
    href: string;
    external?: boolean;
  }[];
}

export type MainNavItem = NavItemWithOptionalChildren;

export type SidebarNavItem = NavItemWithChildren;
