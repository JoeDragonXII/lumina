import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      next: {
        rootDir: "frontend/",
      },
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "frontend/.next/**",
    "frontend/.next-e2e/**",
    "frontend/.next-stale-*/**",
    "lumina-release/**",
    "out/**",
    "build/**",
    "dist/**",
    "next-env.d.ts",
    // Electron desktop wrapper runs in Node (CommonJS), not the Next.js app.
    "electron/**",
  ]),
]);

export default eslintConfig;
