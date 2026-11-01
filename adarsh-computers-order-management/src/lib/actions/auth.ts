"use server";

import { headers } from "next/headers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { message?: string; success?: boolean };
const loginSchema = z.object({ email: z.email(), password: z.string().min(8).max(128) });
const emailSchema = z.object({ email: z.email() });

export async function signInAction(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { message: "Enter a valid email and password." };

  const supabase = await createClient({ rememberMe: false });
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { message: "Sign-in failed. Check your account details." };

  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (profileError || !profile || !["owner", "admin", "editor"].includes(profile.role)) {
    await supabase.auth.signOut();
    return { message: "This account is not authorized for the administrator dashboard." };
  }
  (await cookies()).delete("adarsh_remember");
  redirect("/admin");
}

export async function requestPasswordResetAction(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { message: "Enter a valid email address." };
  const supabase = await createClient();
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", "/admin/reset-password");
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: callback.toString() });
  if (error) return { message: "We could not send the reset email. Check the address and try again." };
  return { success: true, message: "If an account exists for that email, a password reset link has been sent." };
}

export async function updatePasswordAction(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const password = z.string().min(12).max(128).safeParse(formData.get("password"));
  if (!password.success) return { message: "Use a password with at least 12 characters." };
  const confirmation = formData.get("confirmPassword");
  if (confirmation !== password.data) return { message: "The passwords do not match." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: "The reset link has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { message: "The password could not be updated. Request a new reset link." };
  redirect("/admin/login?reset=success");
}

export async function signOutAction() {
  const supabase = await createClient({ rememberMe: false });
  await supabase.auth.signOut();
  (await cookies()).delete("adarsh_remember");
  redirect("/admin/login");
}
