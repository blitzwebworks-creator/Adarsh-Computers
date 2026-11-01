import type { Metadata } from "next";
import { CustomerAuthForms } from "@/components/site/CustomerAuthForms";
import { CustomerAuthFrame } from "@/components/site/CustomerAuthFrame";
export const metadata: Metadata = { title: "Customer Sign In" };
type SearchParams = Promise<{ error?: string; reset?: string; next?: string }>;
export default async function CustomerLoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const notice = params.error === "unauthorized" ? "This area is for customer accounts. Administrator access is separate." : params.error === "callback" ? "That email link has expired. Please request another one." : undefined;
  const returnTo = params.next?.startsWith("/") && !params.next.startsWith("//") && !params.next.includes("\\") ? params.next : "/account";
  return <CustomerAuthFrame title="Welcome back." description="Sign in to review your saved details, order history and checkout."><CustomerAuthForms mode="login" notice={notice} returnTo={returnTo} />{params.reset === "success" && <p className="auth-success" role="status">Password updated. You can sign in now.</p>}</CustomerAuthFrame>;
}
