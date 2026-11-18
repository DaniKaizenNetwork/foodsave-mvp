/** @type {import('jest').Config} */
const FUNCIONES_DE_DOMINIO = [
  './src/reservas/plazo-retiro.ts',
  './src/reservas/cierre-sede.ts',
  './src/reservas/verificar-reserva.ts',
  './src/reservas/verificar-cancelacion.ts',
  './src/ofertas/validar-oferta.ts',
  './src/auth/password.ts',
  './src/auth/roles.guard.ts',
];

module.exports = {
  rootDir: 'src',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  testEnvironment: 'node',
  collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts', '!main.ts'],
  coverageDirectory: '../coverage',
  // Quality Gate del CI: con `--coverage`, cada función de dominio debe conservar al menos
  // 90 % de sentencias, ramas, funciones y líneas. No hay umbral global: controladores,
  // módulos de Nest y código generado no son el objeto de las pruebas unitarias.
  coverageThreshold: Object.fromEntries(
    FUNCIONES_DE_DOMINIO.map((ruta) => [
      ruta,
      { statements: 90, branches: 90, functions: 90, lines: 90 },
    ]),
  ),
};
