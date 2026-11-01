import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/env";

export async function createClient(options: { rememberMe?: boolean } = {}) {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnv();
  const rememberMe = options.rememberMe ?? cookieStore.get("adarsh_remember")?.value === "1";
  return createServerClient(url, key, {
    cookieOptions: { sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", ...(rememberMe ? { maxAge: 60 * 60 * 24 * 30 } : {}) },
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies; src/proxy.ts refreshes sessions on each request.
        }
      },
    },
  });
}
