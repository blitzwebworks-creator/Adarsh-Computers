import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/admin/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || !["owner", "admin", "editor"].includes(profile.role)) {
    redirect("/admin/login?error=unauthorized");
  }
  return { supabase, user, profile };
}

export async function requireCustomer(returnTo = "/account") {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  const loginUrl = "/account/login?next=" + encodeURIComponent(returnTo);
  if (error || !user) redirect(loginUrl);
  const { data: profile, error: profileError } = await supabase.from("profiles").select("id,email,role,created_at").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "customer") redirect(loginUrl + "&error=unauthorized");
  return { supabase, user, profile };
}


