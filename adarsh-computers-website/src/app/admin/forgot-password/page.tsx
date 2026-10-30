import Link from "next/link";
import { AuthFrame } from "@/components/admin/AuthFrame";
import { ResetRequestForm } from "@/components/admin/AuthForms";

export default function ForgotPasswordPage() {
  return <AuthFrame title="Reset your password." description="We’ll send a secure reset link to the email address on your administrator account."><ResetRequestForm /><p className="auth-footnote">Only existing authorized administrators can sign in. Public account registration is not available.</p></AuthFrame>;
}
