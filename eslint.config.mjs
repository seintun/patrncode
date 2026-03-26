import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'src/generated/**']),
  {
    rules: {
      // Enforce `import type` for type-only imports — keeps runtime bundle clean
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      // Warn on explicit `any` — prefer `unknown` with narrowing
      '@typescript-eslint/no-explicit-any': 'warn',
      // Catch unused variables at lint time (TS already catches this but ESLint surfaces it faster)
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      // Disallow non-null assertions — use proper null checks
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // Enforce `T[]` for simple types, `Array<T>` for complex types
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
    },
  },
]);

export default eslintConfig;
