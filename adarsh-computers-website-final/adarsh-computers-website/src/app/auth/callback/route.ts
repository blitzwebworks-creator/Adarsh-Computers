import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") || "/admin/reset-password";
  const safeNext = !next.startsWith("//") && (next === "/admin" || next.startsWith("/admin/") || next === "/account" || next.startsWith("/account/")) ? next : "/admin/reset-password";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, request.url));
  }
  return NextResponse.redirect(new URL(safeNext.startsWith("/account") ? "/account/login?error=callback" : "/admin/login?error=callback", request.url));
}
