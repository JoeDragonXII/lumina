import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "frontend"),
      "@backend": path.resolve(__dirname, "backend"),
      "server-only": path.resolve(__dirname, "tests/support/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    exclude: [
      "tests/e2e/**",
      "node_modules/**",
      ".next/**",
      "frontend/.next/**",
      "frontend/.next-e2e/**",
      "lumina-release/**",
    ],
    setupFiles: ["./tests/support/setup.ts"],
    maxWorkers: 1,
    fileParallelism: false,
  },
});
