import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ETIQUETA_ROL } from '@/lib/auth/tipos';
import type { UsuarioSesion } from '@/lib/auth/tipos';
import { cn } from '@/lib/utils';

function iniciales(nombre: string): string {
  const letras = nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra.charAt(0).toUpperCase());
  return letras.join('') || '?';
}

/** Avatar con las iniciales del usuario y, opcionalmente, su nombre y rol. */
export function AvatarUsuario({
  usuario,
  mostrarDatos = false,
  className
}: {
  usuario: UsuarioSesion;
  mostrarDatos?: boolean;
  className?: string;
}) {
  return (
    <div className='flex min-w-0 items-center gap-2'>
      <Avatar className={className}>
        <AvatarFallback className={cn('bg-sidebar-primary text-sidebar-primary-foreground rounded-lg font-semibold')}>
          {iniciales(usuario.nombre)}
        </AvatarFallback>
      </Avatar>
      {mostrarDatos && (
        <div className='grid min-w-0 flex-1 text-left text-sm leading-tight'>
          <span className='truncate font-semibold'>{usuario.nombre}</span>
          <span className='text-muted-foreground truncate text-xs'>{ETIQUETA_ROL[usuario.rol]}</span>
        </div>
      )}
    </div>
  );
}
