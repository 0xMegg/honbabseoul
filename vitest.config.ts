import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));

// NOTE: @vitejs/plugin-react is intentionally NOT loaded yet — it pins vite
// minor versions tightly and breaks under the vite 7.x that ships with
// vitest 3.x at time of writing. Epic 2/3 will reintroduce it (alongside
// React Refresh) by pinning a compatible vite + plugin-react pair. Until
// then, esbuild's automatic JSX runtime is enough for component render tests.
export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
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
