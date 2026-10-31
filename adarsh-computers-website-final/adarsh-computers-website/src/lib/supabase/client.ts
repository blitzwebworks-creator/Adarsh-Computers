import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/env";

export function createClient() {
  const { url, key } = getSupabaseEnv();
  return createBrowserClient(url, key, { cookieOptions: { sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" } });
}
