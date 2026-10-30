import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="not-found"><div className="not-found-card"><span className="not-found-icon"><Search size={25} /></span><span className="eyebrow">404 · Page not found</span><h1>This page has moved or does not exist.</h1><p>Head back to the Adarsh Computers homepage or browse the catalogue.</p><div><Button asChild><Link href="/">Return home <ArrowLeft size={16} /></Link></Button><Button variant="outline" asChild><Link href="/products">Browse products</Link></Button></div></div></main>;
}
