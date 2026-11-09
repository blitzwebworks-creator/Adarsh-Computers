"use server";

import { headers } from "next/headers";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireCustomer } from "@/lib/auth";
import { PRIVACY_NOTICE_VERSION } from "@/lib/privacy";

export type CustomerAuthState = { message?: string; success?: boolean };
const emailSchema = z.object({ email: z.email().max(254) });
// Existing customers may have passwords created before the stronger signup rule.
const credentialsSchema = z.object({ email: z.email().max(254), password: z.string().min(1).max(128) });

function safeReturnTo(value: FormDataEntryValue | null, fallback = "/account") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("\r") || value.includes("\n")) return fallback;
  return value;
}

export async function registerCustomerAction(_previous: CustomerAuthState, formData: FormData): Promise<CustomerAuthState> {
  const parsed = z.object({ full_name: z.string().trim().min(2).max(120), email: z.email().max(254), password: z.string().min(12).max(128), confirm_password: z.string().min(12).max(128), privacy_consent: z.literal("on"), privacy_notice_version: z.literal(PRIVACY_NOTICE_VERSION) }).safeParse({
    full_name: formData.get("full_name"), email: formData.get("email"), password: formData.get("password"), confirm_password: formData.get("confirm_password"),
    privacy_consent: formData.get("privacy_consent"), privacy_notice_version: formData.get("privacy_notice_version"),
  });
  if (!parsed.success) {
    if (formData.get("privacy_consent") !== "on") return { message: "Review and accept the privacy notice to create an account." };
    return { message: "Enter your name and a valid email, then use a password of at least 12 characters." };
  }
  if (parsed.data.password !== parsed.data.confirm_password) return { message: "The passwords do not match." };
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", safeReturnTo(formData.get("next")));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: callback.toString(), data: { full_name: parsed.data.full_name, privacy_notice_version: parsed.data.privacy_notice_version, privacy_notice_accepted: "yes" } },
  });
  if (error) return { message: "We could not create the account. Check the details or try signing in." };
  if (data.session && data.user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    if (profile?.role === "customer") redirect(safeReturnTo(formData.get("next")));
    await supabase.auth.signOut();
  }
  return { success: true, message: "Check your email for a link to confirm your customer account." };
}

export async function signInCustomerAction(_previous: CustomerAuthState, formData: FormData): Promise<CustomerAuthState> {
  const parsed = credentialsSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { message: "Enter your email and password." };
  const rememberMe = formData.get("remember_me") === "on";
  const supabase = await createClient({ rememberMe });
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { message: "Sign-in failed. Check your account details." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (profile?.role !== "customer") {
    await supabase.auth.signOut();
    return { message: "This sign-in is for customer accounts. Use the administrator sign-in for admin access." };
  }
  const cookieStore = await cookies();
  cookieStore.set("adarsh_remember", rememberMe ? "1" : "0", {
    httpOnly: false, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/",
    ...(rememberMe ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });
  redirect(safeReturnTo(formData.get("next")));
}

export async function requestCustomerPasswordResetAction(_previous: CustomerAuthState, formData: FormData): Promise<CustomerAuthState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { message: "Enter a valid email address." };
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", "/account/reset-password");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: callback.toString() });
  if (error) return { message: "We could not send a reset email. Try again shortly." };
  return { success: true, message: "If a customer account exists for that address, a password reset email has been sent." };
}

export async function updateCustomerPasswordAction(_previous: CustomerAuthState, formData: FormData): Promise<CustomerAuthState> {
  const parsed = z.object({ password: z.string().min(12).max(128), confirm_password: z.string().min(12).max(128) }).safeParse({ password: formData.get("password"), confirm_password: formData.get("confirm_password") });
  if (!parsed.success) return { message: "Use a password with at least 12 characters." };
  if (parsed.data.password !== parsed.data.confirm_password) return { message: "The passwords do not match." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: "This reset link has expired. Request a new one." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "customer") { await supabase.auth.signOut(); return { message: "This password reset link is not for a customer account." }; }
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { message: "The password could not be updated. Request a new reset link." };
  redirect("/account/login?reset=success");
}

export async function signOutCustomerAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete("adarsh_remember");
  redirect("/");
}

export async function saveCustomerDetailsAction(formData: FormData) {
  if (formData.get("privacy_consent") !== "on" || formData.get("privacy_notice_version") !== PRIVACY_NOTICE_VERSION) redirect("/account?profile=consent");
  const parsed = z.object({
    full_name: z.string().trim().min(2).max(120), phone: z.string().trim().min(7).max(30), email: z.email().max(254),
    address: z.string().trim().min(5).max(500), city: z.string().trim().max(120), state: z.string().trim().max(120), pincode: z.string().trim().max(20),
  }).safeParse({
    full_name: formData.get("full_name"), phone: formData.get("phone"), email: formData.get("email"), address: formData.get("address"),
    city: formData.get("city") || "", state: formData.get("state") || "", pincode: formData.get("pincode") || "",
  });
  if (!parsed.success) redirect("/account?profile=invalid");
  const { supabase, user } = await requireCustomer();
  const { data: consentRecorded, error: consentError } = await supabase.rpc("record_adarsh_privacy_consent", { p_purpose: "profile", p_notice_version: PRIVACY_NOTICE_VERSION });
  if (consentError || !consentRecorded) redirect("/account?profile=setup");
  const { error } = await supabase.from("customer_details").upsert({ user_id: user.id, ...parsed.data, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) {
    const missingCustomerDetails = ["PGRST205", "42P01"].includes(error.code || "")
      || /could not find the table|relation .* does not exist/i.test(error.message || "");
    redirect(missingCustomerDetails ? "/account?profile=setup" : "/account?profile=error");
  }
  revalidatePath("/account");
  revalidatePath("/checkout");
  redirect("/account?profile=saved");
}
