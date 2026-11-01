import type { Metadata } from "next";
import { CustomerAuthForms } from "@/components/site/CustomerAuthForms";
import { CustomerAuthFrame } from "@/components/site/CustomerAuthFrame";
export const metadata: Metadata = { title: "Choose a New Password" };
export default function CustomerResetPasswordPage() {
  return <CustomerAuthFrame title="Choose a new password." description="Use a long, unique password that you do not use on other sites."><CustomerAuthForms mode="reset" /></CustomerAuthFrame>;
}
