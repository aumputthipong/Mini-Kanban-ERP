import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Playwright E2E specs — Node-only test files, no React components.
    // The bundled eslint-plugin-react inside eslint-config-next still calls
    // context.getFilename(), which ESLint 10 removed; linting these files
    // crashes the run. They are checked by tsc + Playwright's own typecheck
    // already, so ESLint adds no value here.
    "e2e/**",
    "playwright.config.ts",
  ]),
]);

export default eslintConfig;
