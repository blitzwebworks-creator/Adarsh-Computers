import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, Cpu, Headphones, MapPin, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryCard } from "@/components/site/CategoryCard";
import { ProductCard } from "@/components/site/ProductCard";
import { SectionTitle } from "@/components/site/SectionTitle";
import { getCategories, getProducts, getTestimonials } from "@/lib/data";
import { getSiteSettings } from "@/lib/site-data";

export default async function HomePage() {
  const [settings, categories, products, testimonials] = await Promise.all([getSiteSettings(), getCategories(), getProducts({ featured: true, limit: 4 }), getTestimonials()]);
  const reasons: { icon: LucideIcon; title: string; text: string }[] = [
    { icon: MapPin, title: "A Nehru Place address", text: "A local point of contact in one of New Delhi’s best-known computer markets." },
    { icon: Cpu, title: "Hardware focused", text: "Explore computers, components and peripherals for work and home." },
    { icon: Headphones, title: "Talk through an enquiry", text: "Ask about a product or setup and get in touch directly with the store." },
  ];
  return <>
    <section className="hero-section"><div className="container hero-grid">
      <div className="hero-copy">
        <div className="hero-kicker"><span className="hero-kicker-dot" /> Computer hardware & peripherals <span className="hero-kicker-line" /></div>
        <h1>{settings.home?.headline || "Your Trusted Computer Hardware Partner."}</h1>
        <p>{settings.home?.description || "Computer hardware and peripherals in Nehru Place, New Delhi."}</p>
        <div className="hero-actions"><Button size="lg" variant="lime" asChild><Link href="/products">Explore products <ArrowUpRight size={18} /></Link></Button><Button size="lg" variant="outline" className="hero-contact-button" asChild><Link href="/contact">Contact us <ArrowRight size={17} /></Link></Button></div>
        <div className="hero-caption"><span className="caption-line" /> Serving customers from Nehru Place, New Delhi</div>
      </div>
      <div className="hero-art" aria-label="Computer hardware and peripherals" role="img"><div className="art-grid" /><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
        <div className="chip-card"><div className="chip-top"><span className="chip-label">SYSTEM / 01</span><Sparkles size={17} /></div><div className="chip-icon"><Cpu size={50} strokeWidth={1.2} /></div><strong>Built around<br />what you need.</strong><span className="chip-lines"><i /><i /><i /></span></div>
        <div className="hardware-tag tag-top"><span className="tag-square"><ShieldCheck size={15} /></span><span><b>PRODUCT</b><small>Hardware & parts</small></span><Check size={16} className="tag-check" /></div>
        <div className="hardware-tag tag-bottom"><span className="tag-square tag-light"><Headphones size={15} /></span><span><b>SUPPORT</b><small>Direct store enquiries</small></span><ArrowDownRight size={16} className="tag-check" /></div><div className="art-number">AC<span> / 01</span></div>
      </div>
    </div><div className="container hero-trust"><span>MAKING TECHNOLOGY WORK FOR YOU</span><span className="trust-rule" /><span>NEHRU PLACE · NEW DELHI</span></div></section>

    <section className="section-padding category-section"><div className="container">
      <SectionTitle eyebrow="Find your fit" title="Explore by category" description="Browse the hardware and peripherals that keep your work moving." action={<Button variant="outline" asChild><Link href="/products">All products <ArrowUpRight size={16} /></Link></Button>} />
      {categories.length ? <div className="category-grid">{categories.slice(0, 8).map((category) => <CategoryCard key={category.id} category={category} />)}</div> : <div className="empty-inline">Categories will appear here once the catalogue is set up.</div>}
    </div></section>

    <section className="section-padding featured-section"><div className="container">
      <SectionTitle eyebrow="Selected for you" title="Featured products" description="A closer look at products currently highlighted by the store." action={<Button variant="outline" asChild><Link href="/products">Browse catalogue <ArrowUpRight size={16} /></Link></Button>} />
      {products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="catalogue-empty"><span className="empty-icon"><Cpu size={23} /></span><div><strong>Product updates are on the way.</strong><p>Contact the store to ask about current availability and pricing.</p></div><Button variant="outline" asChild><Link href="/contact">Ask the store <ArrowUpRight size={16} /></Link></Button></div>}
    </div></section>

    <section className="brand-section"><div className="container brand-row"><div><span className="eyebrow eyebrow-light">Brands associated with our store</span><p>Names you know.<br /><strong>Hardware you can ask about.</strong></p></div><div className="brand-list">{(settings.business?.brands || []).map((brand) => <span key={brand}>{brand}</span>)}</div></div></section>

    <section className="section-padding why-section"><div className="container why-grid"><div className="why-intro"><span className="eyebrow">Why Adarsh Computers</span><h2>A straightforward way to find the right setup.</h2><p>We focus on the products you came for and make it easy to reach the people who can help you choose.</p><Button asChild><Link href="/about">Get to know us <ArrowUpRight size={17} /></Link></Button></div>
      <div className="reason-list">{reasons.map(({ icon: Icon, title, text }, index) => <article className="reason-item" key={title}><span className="reason-index">0{index + 1}</span><span className="reason-icon"><Icon size={21} /></span><div><h3>{title}</h3><p>{text}</p></div><ArrowUpRight size={17} className="reason-arrow" /></article>)}</div>
    </div></section>

    {testimonials.length > 0 && <section className="section-padding testimonial-section"><div className="container"><SectionTitle eyebrow="Customer voices" title="What customers say" /><div className="testimonial-grid">{testimonials.slice(0, 3).map((item) => <blockquote className="testimonial-card" key={item.id}><span className="eyebrow">Customer feedback</span><p>“{item.quote}”</p><footer><strong>{item.customer_name}</strong>{item.company && <span>{item.company}</span>}</footer></blockquote>)}</div></div></section>}

    <section className="closing-section"><div className="container closing-card"><div><span className="eyebrow eyebrow-light">Have a question?</span><h2>Let’s get the right technology in your hands.</h2><p>Tell us what you’re looking for, and we’ll help you take the next step.</p></div><Button size="lg" variant="lime" asChild><Link href="/contact">Start an enquiry <ArrowUpRight size={18} /></Link></Button></div></section>
  </>;
}
