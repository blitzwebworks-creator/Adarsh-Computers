import Link from "next/link";
import { ArrowUpRight, Building2, MapPin, Monitor, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/lib/site-data";

export const metadata = { title: "About", description: "Learn about Adarsh Computers in Nehru Place, New Delhi." };

export default async function AboutPage() {
  const { business, about, home } = await getSiteSettings();

  return <>
    <section className="page-hero">
      <div className="container page-hero-inner">
        <span className="eyebrow">About Adarsh Computers</span>
        <h1>Technology, with a local point of contact.</h1>
        <p>{about?.description || "A computer hardware and peripherals business based in Nehru Place, New Delhi."}</p>
        <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><span>About</span></div>
      </div>
    </section>
    <section className="section-padding">
      <div className="container about-grid">
        <div className="about-copy">
          <span className="eyebrow">Our business</span>
          <h2>Focused on the hardware that keeps you connected.</h2>
          <p>{about?.story || "Adarsh Computers serves customers looking for computer hardware and peripherals in Nehru Place."}</p>
          <p>{home?.tagline || "Making Technology Work For You"}</p>
          <Button asChild><Link href="/contact">Talk to the store <ArrowUpRight size={16} /></Link></Button>
        </div>
        <div className="about-panel">
          <div className="about-panel-top"><span className="about-emblem"><Monitor size={25} /></span><span className="eyebrow">Established in Nehru Place</span></div>
          <h3>{business?.name || "Adarsh Computers"}</h3>
          <p>Computer Hardware &amp; Peripherals</p>
          <div className="about-fact"><MapPin size={17} /><span>{business?.address || "Nehru Place, New Delhi"}</span></div>
          {business?.owner && <div className="about-fact"><Building2 size={17} /><span>Owner: {business.owner}</span></div>}
          {business?.phone && <a className="about-fact" href={"tel:" + business.phone}><Phone size={17} /><span>{business.phone}</span></a>}
        </div>
      </div>
    </section>
    <section className="digital-partner-section" aria-labelledby="digital-partner-title">
      <div className="container">
        <div className="digital-partner-card">
          <span className="digital-partner-mark" aria-hidden="true">BW</span>
          <div className="digital-partner-copy">
            <span className="eyebrow" id="digital-partner-title">Digital partner</span>
            <span className="digital-partner-service">Website design &amp; development</span>
          </div>
          <a className="digital-partner-link" href="https://blitzwebwork.vercel.app/" target="_blank" rel="noopener noreferrer">BlitzWebWorks <ArrowUpRight size={15} /></a>
        </div>
      </div>
    </section>
  </>;
}
