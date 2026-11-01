import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function AuthFrame({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <main className="auth-page"><div className="auth-brand-line"><Link href="/" className="brand-lockup"><Image src="/brand/adarsh-computers-logo.png" alt="" width={42} height={42} className="brand-logo" /><span className="brand-copy"><strong>ADARSH</strong><small>COMPUTERS</small></span></Link><Link href="/" className="auth-back"><ArrowLeft size={15} /> Return to website</Link></div><section className="auth-card"><Image src="/brand/adarsh-computers-logo.png" alt="Adarsh Computers logo" width={45} height={45} className="auth-card-logo" /><span className="eyebrow">Administrator access</span><h1>{title}</h1><p>{description}</p>{children}<div className="auth-secure-note"><span /> Secure sign-in · Access is limited to authorized accounts</div></section><span className="auth-orbit auth-orbit-one" /><span className="auth-orbit auth-orbit-two" /></main>;
}
