import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";
import react from "@vitejs/plugin-react";

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    // Co-located unit + component tests live next to the module under
    // test as `*.test.ts` / `*.test.tsx`. Playwright e2e specs are
    // isolated under `e2e/` and intentionally excluded from Vitest.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "e2e/**", "playwright-report/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(here, "./src"),
    },
  },
});
