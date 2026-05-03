/**
 * Smoke test for src/lib/env.ts.
 *
 * Asserts that `requireEnv` throws a `MissingEnvError` when the variable
 * is undefined or empty, and returns the literal value when set. Also
 * checks the public/server getter facades dispatch through `requireEnv`.
 *
 * This test exists so `pnpm test` has a non-trivial assertion target
 * from day 1 — every other slice can grow tests next to its own code.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  MissingEnvError,
  publicEnv,
  requireEnv,
  requireFirstEnv,
  serverEnv,
} from "@/lib/env";

const VAR = "__VITEST_ENV_PROBE__";

describe("requireEnv", () => {
  const originalValue = process.env[VAR];
  beforeEach(() => {
    delete process.env[VAR];
  });
  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env[VAR];
    } else {
      process.env[VAR] = originalValue;
    }
  });

  it("throws MissingEnvError when the variable is undefined", () => {
    expect(() => requireEnv(VAR)).toThrow(MissingEnvError);
  });

  it("throws MissingEnvError when the variable is empty string", () => {
    process.env[VAR] = "";
    expect(() => requireEnv(VAR)).toThrow(MissingEnvError);
  });

  it("returns the literal value when set", () => {
    process.env[VAR] = "hello";
    expect(requireEnv(VAR)).toBe("hello");
  });

  it("attaches the missing key to MissingEnvError instances", () => {
    try {
      requireEnv(VAR);
      throw new Error("requireEnv should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(MissingEnvError);
      expect((err as MissingEnvError).key).toBe(VAR);
    }
  });
});

describe("requireFirstEnv", () => {
  const keys = ["__VITEST_FIRST_ENV_PRIMARY__", "__VITEST_FIRST_ENV_FALLBACK__"];

  afterEach(() => {
    for (const key of keys) delete process.env[key];
  });

  it("returns the first non-empty environment value", () => {
    process.env.__VITEST_FIRST_ENV_PRIMARY__ = "primary";
    process.env.__VITEST_FIRST_ENV_FALLBACK__ = "fallback";
    expect(requireFirstEnv(keys)).toBe("primary");
  });

  it("falls back when the preferred key is unset", () => {
    process.env.__VITEST_FIRST_ENV_FALLBACK__ = "fallback";
    expect(requireFirstEnv(keys)).toBe("fallback");
  });

  it("throws MissingEnvError when every candidate is missing or empty", () => {
    process.env.__VITEST_FIRST_ENV_PRIMARY__ = "";
    expect(() => requireFirstEnv(keys)).toThrow(MissingEnvError);
  });
});

describe("env getter facades", () => {
  it("publicEnv.supabaseUrl reads NEXT_PUBLIC_SUPABASE_URL via requireEnv", () => {
    const original = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    try {
      expect(publicEnv.supabaseUrl).toBe("https://example.supabase.co");
    } finally {
      if (original === undefined) {
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      } else {
        process.env.NEXT_PUBLIC_SUPABASE_URL = original;
      }
    }
  });

  it("publicEnv.supabasePublicKey prefers publishable key over legacy anon", () => {
    const originalPublishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const originalAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_new";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "legacy-anon";
    try {
      expect(publicEnv.supabasePublicKey).toBe("sb_publishable_new");
    } finally {
      if (originalPublishable === undefined) {
        delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      } else {
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalPublishable;
      }
      if (originalAnon === undefined) {
        delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      } else {
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnon;
      }
    }
  });

  it("serverEnv.supabaseProjectRef reads SUPABASE_PROJECT_REF via requireEnv", () => {
    const original = process.env.SUPABASE_PROJECT_REF;
    process.env.SUPABASE_PROJECT_REF = "abc123def456";
    try {
      expect(serverEnv.supabaseProjectRef).toBe("abc123def456");
    } finally {
      if (original === undefined) {
        delete process.env.SUPABASE_PROJECT_REF;
      } else {
        process.env.SUPABASE_PROJECT_REF = original;
      }
    }
  });

  it("serverEnv.supabaseAdminKey prefers SUPABASE_SECRET_KEY over legacy service_role", () => {
    const originalSecret = process.env.SUPABASE_SECRET_KEY;
    const originalServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_SECRET_KEY = "sb_secret_new";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "legacy-service-role";
    try {
      expect(serverEnv.supabaseAdminKey).toBe("sb_secret_new");
    } finally {
      if (originalSecret === undefined) {
        delete process.env.SUPABASE_SECRET_KEY;
      } else {
        process.env.SUPABASE_SECRET_KEY = originalSecret;
      }
      if (originalServiceRole === undefined) {
        delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      } else {
        process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRole;
      }
    }
  });
});
