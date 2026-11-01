import type { Metadata } from "next";
import { CustomerAuthForms } from "@/components/site/CustomerAuthForms";
import { CustomerAuthFrame } from "@/components/site/CustomerAuthFrame";
export const metadata: Metadata = { title: "Create Customer Account" };
type SearchParams = Promise<{ next?: string }>;
export default async function CustomerSignupPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const returnTo = params.next?.startsWith("/") && !params.next.startsWith("//") && !params.next.includes("\\") ? params.next : "/account";
  return <CustomerAuthFrame title="Create your account." description="Create an account to save your contact details and see your previous orders."><CustomerAuthForms mode="signup" returnTo={returnTo} /><p className="customer-auth-footnote">You can browse products without signing in. Sign in is required to place an order.</p></CustomerAuthFrame>;
}
