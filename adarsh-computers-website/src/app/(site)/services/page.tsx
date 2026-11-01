import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServices } from "@/lib/data";

export const metadata = { title: "Services", description: "Explore services offered by Adarsh Computers." };
export default async function ServicesPage() {
  const services = await getServices();
  return <>
    <section className="page-hero"><div className="container page-hero-inner"><span className="eyebrow">Support & services</span><h1>Practical help, from people who know hardware.</h1><p>See the services currently offered by Adarsh Computers. Contact the store to discuss what you need.</p><div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><span>Services</span></div></div></section>
    <section className="section-padding"><div className="container">{services.length ? <div className="service-grid">{services.map((service) => <article className="service-card" key={service.id}>{service.image_url ? <div className="service-image"><Image src={service.image_url} alt="" fill sizes="(max-width: 720px) 100vw, 33vw" /></div> : <div className="service-icon"><Wrench size={26} /></div>}<span className="eyebrow">Adarsh Computers</span><h2>{service.name}</h2>{service.description && <p>{service.description}</p>}<Link href={"/contact?product=" + encodeURIComponent(service.name)} className="text-link">Ask about this service <ArrowUpRight size={16} /></Link></article>)}</div> : <div className="catalogue-empty page-empty"><span className="empty-icon"><Wrench size={22} /></span><div><strong>Service information is being prepared.</strong><p>Contact the store and tell us what kind of help you need.</p></div><Button asChild><Link href="/contact">Contact us <ArrowUpRight size={16} /></Link></Button></div>}</div></section>
  </>;
}
