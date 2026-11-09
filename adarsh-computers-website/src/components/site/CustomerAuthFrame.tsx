import Link from "next/link";
import { ArrowLeft, UserRound } from "lucide-react";
import type { ReactNode } from "react";

export function CustomerAuthFrame({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="customer-auth-section"><div className="customer-auth-card surface"><Link href="/" className="auth-back"><ArrowLeft size={15} /> Return to website</Link><span className="customer-auth-mark"><UserRound size={21} /></span><span className="eyebrow">Customer account</span><h1>{title}</h1><p className="customer-auth-description">{description}</p>{children}</div></section>;
}
