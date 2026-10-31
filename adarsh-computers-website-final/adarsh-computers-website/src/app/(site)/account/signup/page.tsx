import type { Metadata } from "next";
import { CustomerAuthForms } from "@/components/site/CustomerAuthForms";
import { CustomerAuthFrame } from "@/components/site/CustomerAuthFrame";
export const metadata: Metadata = { title: "Create Customer Account" };
export default function CustomerSignupPage() {
  return <CustomerAuthFrame title="Create your account." description="Save your contact details and see your previous orders in one place."><CustomerAuthForms mode="signup" /><p className="customer-auth-footnote">You can also browse products and place orders as a guest.</p></CustomerAuthFrame>;
}
