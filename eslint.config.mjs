import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  { files:['src/frontend/**/*.{ts,tsx}'], rules:{'react-hooks/set-state-in-effect':'off'} },
  globalIgnores(['.next/**','node_modules/**','output/**','docs/archives/**']),
]);
