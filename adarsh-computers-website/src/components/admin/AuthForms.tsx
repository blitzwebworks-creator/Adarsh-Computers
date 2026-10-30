"use client";
import Link from "next/link";
import { useActionState } from "react";
import { ArrowUpRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { requestPasswordResetAction, signInAction, updatePasswordAction, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: AuthActionState = {};
export function LoginForm() {
  const [state, action, pending] = useActionState(signInAction, initialState);
  return <form className="auth-form" action={action}><label>Email address<Input name="email" type="email" required autoComplete="username" /></label><label>Password<Input name="password" type="password" required minLength={8} autoComplete="current-password" /></label>{state.message && <p className="auth-error" role="alert">{state.message}</p>}<Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? <>Signing in <LoaderCircle className="spin" size={16} /></> : <>Sign in securely <LockKeyhole size={16} /></>}</Button><Link className="auth-inline-link" href="/admin/forgot-password">Forgot password?</Link></form>;
}
export function ResetRequestForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initialState);
  return <form className="auth-form" action={action}><label>Email address<Input name="email" type="email" required autoComplete="email" /></label>{state.message && <p className={state.success ? "auth-success" : "auth-error"} role="status">{state.message}</p>}<Button type="submit" size="lg" disabled={pending}>{pending ? <>Sending <LoaderCircle className="spin" size={16} /></> : <>Send reset link <ArrowUpRight size={16} /></>}</Button><Link className="auth-inline-link" href="/admin/login">Back to sign in</Link></form>;
}
export function NewPasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, initialState);
  return <form className="auth-form" action={action}><label>New password<Input name="password" type="password" required minLength={12} autoComplete="new-password" /></label><label>Confirm new password<Input name="confirmPassword" type="password" required minLength={12} autoComplete="new-password" /></label>{state.message && <p className="auth-error" role="alert">{state.message}</p>}<Button type="submit" size="lg" disabled={pending}>{pending ? <>Updating <LoaderCircle className="spin" size={16} /></> : <>Update password <LockKeyhole size={16} /></>}</Button></form>;
}
