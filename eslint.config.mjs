import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';

/**
 * ESLint básico del monorepo (apps/api y apps/web): reglas «recommended» de ESLint y de
 * typescript-eslint, sin reglas que exijan información de tipos (rápido, sin tsconfig).
 *
 * Quality Gate: cualquier regla en nivel `error` rompe el CI. Las tres reglas de abajo
 * se dejan en `warn` porque el código existente ya las incumple (deuda técnica reportada
 * en docs/calidad/11_CI_Quality_Gate/README.md); no se reescribió código para cumplirlas.
 */
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/*.d.ts',
      'apps/api/src/generated/**',
      'e2e/**',
      'docs/**'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // El código de la plantilla ya cita reglas de Next en sus comentarios `eslint-disable`.
    files: ['apps/web/src/**/*.{ts,tsx}'],
    plugins: { '@next/next': nextPlugin },
    rules: { '@next/next/no-img-element': 'warn' }
  },
  {
    files: ['apps/api/src/**/*.ts', 'apps/web/src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn'
    }
  }
);
