'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';
import { navGroups } from '@/config/nav-config';
import { useFilteredNavGroups } from '@/hooks/use-nav';
import { useAuth } from '@/lib/auth/auth-context';
import type { NavItem } from '@/types';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icons } from '../icons';
import { AvatarUsuario } from './avatar-usuario';

// Estilos del menú (los de la plantilla). Activo = pastilla suave + peso medio + icono en
// el color primario del sidebar (amarillo miel); hover = pastilla más clara.
const itemClass =
  'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground data-active:hover:bg-sidebar-accent [&>svg]:text-sidebar-foreground/60 data-active:[&>svg:first-child]:text-sidebar-primary';
// 4px de padding horizontal en el riel de iconos para que quepan los botones de 32px
const railPadding = 'group-data-[collapsible=icon]:px-1';

export default function AppSidebar() {
  const pathname = usePathname();
  const filteredGroups = useFilteredNavGroups(navGroups);

  return (
    <Sidebar collapsible='icon' variant='inset'>
      <SidebarHeader className={railPadding}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size='lg'
              render={<Link href='/ofertas' aria-label='FoodSave, ir a las ofertas' />}
              className='h-12 hover:bg-transparent active:bg-transparent'
            >
              {/* El sidebar es oscuro en claro y en oscuro: siempre el logo para fondos oscuros */}
              <img
                src='/brand/foodsave-logo-horizontal-claro.svg'
                alt='FoodSave'
                className='h-9 w-auto group-data-[collapsible=icon]:hidden'
              />
              <img
                src='/brand/foodsave-icon.svg'
                alt='FoodSave'
                className='hidden size-8 group-data-[collapsible=icon]:block'
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        {filteredGroups.map((group) => (
          <SidebarGroup key={group.label || 'sin-grupo'} className={railPadding}>
            {group.label && (
              // El riel oculta las etiquetas subiéndolas sobre el último ítem del grupo anterior
              // (-mt-8 + opacity-0); sin pointer-events-none se tragarían sus clics
              <SidebarGroupLabel className='group-data-[collapsible=icon]:pointer-events-none'>
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarMenu className='gap-0.5'>
              {group.items.map((item) => (
                <NavMainItem key={item.title} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className={railPadding}>
        <NavUser />
      </SidebarFooter>
      <SidebarRail className='hover:after:bg-transparent' />
    </Sidebar>
  );
}

function isActivePath(pathname: string, url: string) {
  return pathname === url || (url !== '/' && url !== '#' && pathname.startsWith(`${url}/`));
}

function NavMainItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const { setOpenMobile } = useSidebar();
  const Icon = item.icon ? Icons[item.icon] : Icons.logo;
  // «Ofertas» no debe quedar activa en /ofertas/nueva: gana el ítem más específico.
  const active =
    pathname === item.url ||
    (isActivePath(pathname, item.url) &&
      !navGroups.some((grupo) =>
        grupo.items.some(
          (otro) => otro.url !== item.url && otro.url.startsWith(`${item.url}/`) && isActivePath(pathname, otro.url)
        )
      ));

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={
          <Link href={item.url} aria-label={item.title} aria-current={active ? 'page' : undefined} />
        }
        tooltip={item.title}
        isActive={active}
        className={itemClass}
        onClick={() => setOpenMobile(false)}
      >
        <Icon />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavUser() {
  const { usuario, cargando, cerrarSesion } = useAuth();
  const router = useRouter();
  const { isMobile, state } = useSidebar();
  const railMenu = state === 'collapsed' && !isMobile;

  if (cargando) return null;

  // Visitante: accesos a iniciar sesión y registrarse
  if (!usuario) {
    return (
      <SidebarMenu className='gap-0.5'>
        <SidebarMenuItem>
          <SidebarMenuButton render={<Link href='/login' />} tooltip='Ingresar' className={itemClass}>
            <Icons.login />
            <span>Ingresar</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton render={<Link href='/registro' />} tooltip='Crear cuenta' className={itemClass}>
            <Icons.user />
            <span>Crear cuenta</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size='lg'
                className='data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground'
              />
            }
          >
            <AvatarUsuario className='size-8 rounded-lg' mostrarDatos usuario={usuario} />
            <Icons.chevronsUpDown className='text-muted-foreground ml-auto size-4' />
          </DropdownMenuTrigger>
          {/* Escritorio: se abre a la derecha; móvil: hacia arriba dentro de la hoja. */}
          <DropdownMenuContent
            className={isMobile ? 'w-(--anchor-width) min-w-60' : 'w-64'}
            side={isMobile ? 'top' : 'right'}
            align={isMobile ? 'start' : 'end'}
            sideOffset={isMobile ? 4 : railMenu ? 16 : 8}
            alignOffset={isMobile ? 0 : -8}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className='text-foreground px-1.5 py-1.5 font-normal'>
                <AvatarUsuario className='size-8 rounded-lg' mostrarDatos usuario={usuario} />
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  cerrarSesion();
                  router.push('/login');
                }}
              >
                <Icons.logout aria-hidden />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
