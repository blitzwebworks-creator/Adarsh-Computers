import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Building2, MapPin, Monitor, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/lib/site-data";
import { BUSINESS_MAP_URL } from "@/lib/maps";

export const metadata = { title: "About", description: "About Adarsh Computers, your trusted computer hardware partner in Nehru Place, New Delhi." };

export default async function AboutPage() {
  const { business } = await getSiteSettings();

  return <>
    <section className="page-hero about-page-hero">
      <div className="container page-hero-inner">
        <span className="eyebrow">About Adarsh Computers</span>
        <h1>About Adarsh Computers</h1>
        <p>Your Trusted Computer Hardware Partner</p>
        <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><span>About</span></div>
      </div>
    </section>

    <section className="section-padding about-story-section">
      <div className="container about-story-grid">
        <div className="about-copy about-story-copy">
          <span className="eyebrow">Computer hardware &amp; peripherals</span>
          <div className="about-description">
            <p>Adarsh Computers is your trusted destination for computer hardware and peripherals in Nehru Place, New Delhi. We deal in a range of computer hardware, components, accessories and peripherals from leading brands including Dell, HP, Lenovo, Intel, LG and Canon.</p>
            <p>Whether you're looking for computer components, laptops, hardware upgrades or essential accessories, we aim to help you find the right products according to your needs.</p>
            <p>Visit us at 203, Osian Building, 12, Nehru Place, near Nehru Enclave Metro Station Gate No. 2, New Delhi.</p>
            <p>Adarsh Computers – Making Technology Work For You.</p>
          </div>
          <Button variant="outline" className="about-directions-button" asChild>
            <a href={BUSINESS_MAP_URL} target="_blank" rel="noopener noreferrer">Get Directions <ArrowUpRight size={16} /></a>
          </Button>
        </div>

        <div className="about-photo-gallery" role="group" aria-label="Photographs of the Adarsh Computers shop signboard">
          <figure className="about-photo about-photo-featured">
            <div className="about-photo-media about-photo-media-featured">
              <Image src="/images/adarsh-computers-signboard-main.png" alt="Original photograph of the Adarsh Computers signboard above the Nehru Place storefront." fill sizes="(max-width: 900px) 100vw, (max-width: 1240px) 52vw, 620px" quality={85} />
            </div>
            <figcaption>Adarsh Computers · Nehru Place, New Delhi</figcaption>
          </figure>

          <figure className="about-photo about-photo-supporting">
            <div className="about-photo-media about-photo-media-supporting">
              <Image src="/images/adarsh-computers-shop-signboard.png" alt="Original photograph of the Adarsh Computers signboard above the shop interior, viewed from below." fill sizes="(max-width: 900px) 44vw, 260px" quality={85} />
            </div>
            <figcaption>The shop signboard and interior</figcaption>
          </figure>

          <div className="about-panel about-photo-business">
            <div className="about-panel-top"><span className="about-emblem"><Monitor size={25} /></span><span className="eyebrow">Visit our shop</span></div>
            <h3>{business?.name || "Adarsh Computers"}</h3>
            <p>Computer Hardware &amp; Peripherals</p>
            <div className="about-fact"><MapPin size={17} /><span>{business?.address || "203, Osian Building, 12, Nehru Place, near Nehru Enclave Metro Station Gate No. 2, New Delhi."}</span></div>
            {business?.owner && <div className="about-fact"><Building2 size={17} /><span>Owner: {business.owner}</span></div>}
            {business?.phone && <a className="about-fact" href={"tel:" + business.phone}><Phone size={17} /><span>{business.phone}</span></a>}
          </div>
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
