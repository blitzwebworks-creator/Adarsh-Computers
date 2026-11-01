import Link from "next/link";
import { AuthFrame } from "@/components/admin/AuthFrame";
import { NewPasswordForm } from "@/components/admin/AuthForms";

export default function ResetPasswordPage() {
  return <AuthFrame title="Choose a new password." description="Use a long, unique password that you do not use on other sites."><NewPasswordForm /><Link className="auth-inline-link" href="/admin/login">Back to sign in</Link></AuthFrame>;
}
