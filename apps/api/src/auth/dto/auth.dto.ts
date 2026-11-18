import { ErrorNegocio } from '../../common/errores';

export interface RegistroDto {
  nombre: string;
  correo: string;
  contrasena: string;
}

export interface LoginDto {
  correo: string;
  contrasena: string;
}

function textoNoVacio(valor: unknown, recortar: boolean): string {
  if (typeof valor !== 'string') throw new ErrorNegocio('CAMPOS_INVALIDOS');
  const texto = recortar ? valor.trim() : valor;
  if (texto.length === 0) throw new ErrorNegocio('CAMPOS_INVALIDOS');
  return texto;
}

/** El correo se guarda y se compara normalizado: sin espacios y en minúsculas. */
export function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase();
}

/** Solo se exige que nombre, correo y contraseña no estén vacíos (sin política de contraseña). */
export function validarRegistro(cuerpo: unknown): RegistroDto {
  const datos = (cuerpo ?? {}) as Record<string, unknown>;
  return {
    nombre: textoNoVacio(datos.nombre, true),
    correo: normalizarCorreo(textoNoVacio(datos.correo, true)),
    contrasena: textoNoVacio(datos.contrasena, false),
  };
}

export function validarLogin(cuerpo: unknown): LoginDto {
  const datos = (cuerpo ?? {}) as Record<string, unknown>;
  return {
    correo: normalizarCorreo(textoNoVacio(datos.correo, true)),
    contrasena: textoNoVacio(datos.contrasena, false),
  };
}
