import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/env";

export function createClient() {
  const { url, key } = getSupabaseEnv();
  const rememberMe = typeof document !== "undefined" && document.cookie.split("; ").some((cookie) => cookie === "adarsh_remember=1");
  return createBrowserClient(url, key, { cookieOptions: { sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", ...(rememberMe ? { maxAge: 60 * 60 * 24 * 30 } : {}) } });
}
