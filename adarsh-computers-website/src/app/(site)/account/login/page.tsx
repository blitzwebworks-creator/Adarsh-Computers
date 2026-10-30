import type { Metadata } from "next";
import { CustomerAuthForms } from "@/components/site/CustomerAuthForms";
import { CustomerAuthFrame } from "@/components/site/CustomerAuthFrame";
export const metadata: Metadata = { title: "Customer Sign In" };
type SearchParams = Promise<{ error?: string; reset?: string }>;
export default async function CustomerLoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const notice = params.error === "unauthorized" ? "This area is for customer accounts. Administrator access is separate." : params.error === "callback" ? "That email link has expired. Please request another one." : undefined;
  return <CustomerAuthFrame title="Welcome back." description="Sign in to review your saved details and order history."><CustomerAuthForms mode="login" notice={notice} />{params.reset === "success" && <p className="auth-success" role="status">Password updated. You can sign in now.</p>}</CustomerAuthFrame>;
}
