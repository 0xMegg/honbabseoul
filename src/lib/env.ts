/**
 * Typed environment variable reader.
 *
 * `requireEnv("FOO")` throws at first access if `FOO` is missing or empty,
 * so build-time / boot-time failures are loud instead of silent `undefined`s
 * leaking into Supabase client constructors.
 *
 * Public envs (NEXT_PUBLIC_*) are safe to read in the browser bundle.
 * Server-only envs are read only from server modules — see
 * `src/lib/supabase/admin.ts` for the build-time guard.
 */

export class MissingEnvError extends Error {
  readonly key: string;
  constructor(key: string) {
    super(
      `Missing required environment variable: ${key}. ` +
        `Set it in .env.local (see .env.local.example).`,
    );
    this.name = "MissingEnvError";
    this.key = key;
  }
}

export function requireEnv(key: string): string {
  const value = process.env[key];
  return requireEnvValue(key, value);
}

function requireEnvValue(key: string, value: string | undefined): string {
  if (value === undefined || value === "") {
    throw new MissingEnvError(key);
  }
  return value;
}

export function requireFirstEnv(keys: readonly string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined && value !== "") {
      return value;
    }
  }
  throw new MissingEnvError(keys.join(" or "));
}

export function optionalEnv(key: string): string | undefined {
  const value = process.env[key];
  return value === undefined || value === "" ? undefined : value;
}

/**
 * Public envs — fine to read on either side of the client/server boundary.
 */
export const publicEnv = {
  get supabaseUrl(): string {
    return requireEnvValue(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
  },
  get supabasePublicKey(): string {
    if (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    }
    return requireEnvValue(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  },
  get supabaseAnonKey(): string {
    return requireEnvValue(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  },
  get naverMapsClientId(): string {
    return requireEnvValue(
      "NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID",
      process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID,
    );
  },
} as const;

/**
 * Server-only envs — readers MUST live in server modules. Importing this
 * accessor from a `"use client"` file does not throw at import time, but
 * any actual `.serviceRoleKey` read in the browser bundle is blocked
 * elsewhere by `src/lib/supabase/admin.ts`'s `"server-only"` guard.
 */
export const serverEnv = {
  get supabaseAdminKey(): string {
    return requireFirstEnv(["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"]);
  },
  get supabaseServiceRoleKey(): string {
    return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  },
  get supabaseProjectRef(): string {
    return requireEnv("SUPABASE_PROJECT_REF");
  },
  get naverSearchClientId(): string | undefined {
    return optionalEnv("NAVER_SEARCH_CLIENT_ID");
  },
  get naverSearchClientSecret(): string | undefined {
    return optionalEnv("NAVER_SEARCH_CLIENT_SECRET");
  },
} as const;
