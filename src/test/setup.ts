/**
 * Vitest global setup — loaded once per worker before any test file.
 *
 * Adds @testing-library/jest-dom matchers (`toBeInTheDocument`, etc.)
 * and a global `cleanup` after each test so DOM state does not leak
 * between tests in the same file.
 */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
