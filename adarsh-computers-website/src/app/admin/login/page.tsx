import { AuthFrame } from "@/components/admin/AuthFrame";
import { LoginForm } from "@/components/admin/AuthForms";

type SearchParams = Promise<{ error?: string; reset?: string }>;
export default async function AdminLoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <AuthFrame title="Welcome back." description="Sign in to manage products, enquiries and website content.">
    {params.error === "unauthorized" && <p className="auth-error" role="alert">This account does not have administrator access.</p>}
    {params.error === "callback" && <p className="auth-error" role="alert">That sign-in or reset link has expired. Please try again.</p>}
    {params.reset === "success" && <p className="auth-success" role="status">Your password was updated. You can sign in now.</p>}
    <LoginForm />
  </AuthFrame>;
}
