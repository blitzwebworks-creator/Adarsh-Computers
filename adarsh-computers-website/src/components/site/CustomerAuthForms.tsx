"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  registerCustomerAction,
  requestCustomerPasswordResetAction,
  signInCustomerAction,
  updateCustomerPasswordAction,
  type CustomerAuthState,
} from "@/lib/actions/customer-auth";

type Mode = "login" | "signup" | "forgot" | "reset";
const actions = { login: signInCustomerAction, signup: registerCustomerAction, forgot: requestCustomerPasswordResetAction, reset: updateCustomerPasswordAction };

export function CustomerAuthForms({ mode, notice }: { mode: Mode; notice?: string }) {
  const [state, action, pending] = useActionState<CustomerAuthState, FormData>(actions[mode], {});
  const success = state.success;
  return <div className="customer-auth-content">
    {notice && <p className="auth-error" role="alert">{notice}</p>}
    {mode === "login" && <form action={action} className="customer-auth-form"><label>Email address<Input name="email" type="email" required autoComplete="email" /></label><label>Password<Input name="password" type="password" required minLength={12} autoComplete="current-password" /></label>{state.message && <p className={success ? "auth-success" : "auth-error"} role="status">{state.message}</p>}<Button type="submit" size="lg" disabled={pending}>{pending ? <>Signing in <LoaderCircle className="spin" size={17} /></> : <>Sign in <LockKeyhole size={16} /></>}</Button><Link className="auth-inline-link" href="/account/forgot-password">Forgot password?</Link><p className="customer-auth-switch">New here? <Link href="/account/signup">Create a customer account</Link></p></form>}
    {mode === "signup" && <form action={action} className="customer-auth-form"><label>Full name<Input name="full_name" required minLength={2} maxLength={120} autoComplete="name" /></label><label>Email address<Input name="email" type="email" required autoComplete="email" /></label><label>Password<Input name="password" type="password" required minLength={12} autoComplete="new-password" /></label><label>Confirm password<Input name="confirm_password" type="password" required minLength={12} autoComplete="new-password" /></label>{state.message && <p className={success ? "auth-success" : "auth-error"} role="status">{state.message}</p>}<Button type="submit" size="lg" disabled={pending} aria-busy={pending}>{pending ? <><LoaderCircle className="spin" size={17} /> Creating account…</> : <>Create account <ArrowRight size={16} /></>}</Button><p className="customer-auth-switch">Already registered? <Link href="/account/login">Sign in</Link></p></form>}
    {mode === "forgot" && <form action={action} className="customer-auth-form"><label>Email address<Input name="email" type="email" required autoComplete="email" /></label>{state.message && <p className={success ? "auth-success" : "auth-error"} role="status">{state.message}</p>}<Button type="submit" size="lg" disabled={pending}>{pending ? <>Sending link <LoaderCircle className="spin" size={17} /></> : <>Send reset link <ArrowRight size={16} /></>}</Button><Link className="auth-inline-link" href="/account/login">Back to sign in</Link></form>}
    {mode === "reset" && <form action={action} className="customer-auth-form"><label>New password<Input name="password" type="password" required minLength={12} autoComplete="new-password" /></label><label>Confirm new password<Input name="confirm_password" type="password" required minLength={12} autoComplete="new-password" /></label>{state.message && <p className={success ? "auth-success" : "auth-error"} role="status">{state.message}</p>}<Button type="submit" size="lg" disabled={pending}>{pending ? <>Updating password <LoaderCircle className="spin" size={17} /></> : <>Update password <LockKeyhole size={16} /></>}</Button></form>}
  </div>;
}
