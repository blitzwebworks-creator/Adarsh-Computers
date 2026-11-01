import type { Metadata } from "next";
import { CustomerAuthForms } from "@/components/site/CustomerAuthForms";
import { CustomerAuthFrame } from "@/components/site/CustomerAuthFrame";
export const metadata: Metadata = { title: "Reset Customer Password" };
export default function CustomerForgotPasswordPage() {
  return <CustomerAuthFrame title="Reset your password." description="We’ll send a secure reset link if a customer account exists for that address."><CustomerAuthForms mode="forgot" /></CustomerAuthFrame>;
}
