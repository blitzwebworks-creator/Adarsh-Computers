import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import { ProductGallery } from "@/components/site/ProductGallery";
import { ProductPurchaseControls } from "@/components/site/ProductPurchaseControls";
import { Button } from "@/components/ui/button";
import { getProduct } from "@/lib/data";
import { formatCurrency, whatsappHref } from "@/lib/utils";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  return product ? { title: product.name, description: product.description || `${product.name} from Adarsh Computers. Contact the store to confirm current availability.` } : { title: "Product not found" };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  const images = [...new Set([product.image_url, ...(product.image_urls || [])].filter((value): value is string => Boolean(value)))];
  const available = product.price !== null && product.availability !== "Out of stock" && product.stock_quantity !== 0;
  const availability = product.stock_quantity === 0 ? "Out of stock" : product.availability;
  const discounted = product.compare_at_price !== null && product.price !== null && product.compare_at_price > product.price;
  const whatsappMessage = `Hello Adarsh Computers, I would like to enquire about ${product.name}${product.brand ? ` by ${product.brand}` : ""}.`;
  const specs = product.specifications && typeof product.specifications === "object" ? Object.entries(product.specifications).filter(([key, value]) => key.trim() && String(value).trim()) : [];

  return <>
    <section className="page-hero product-detail-hero"><div className="container page-hero-inner"><div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/products">Products</Link>{product.categories?.name && <><span>/</span><Link href={"/products?category=" + product.categories.slug}>{product.categories.name}</Link></>}<span>/</span><span>{product.name}</span></div></div></section>
    <section className="product-detail-section"><div className="container product-detail-grid">
      <ProductGallery key={product.id} images={images} name={product.name} />
      <div className="product-detail-copy">
        <span className="product-detail-category">{product.categories?.name || "Computer hardware & peripherals"}</span>
        {product.brand && <span className="product-detail-brand">{product.brand}{product.categories?.name ? " · " : ""}{product.categories?.name || ""}</span>}
        <h1>{product.name}</h1>
        <div className="product-detail-availability"><span className={availability === "Out of stock" ? "availability-pill unavailable" : "availability-pill"}><i />{availability}</span><span>Availability confirmed by the store</span></div>
        <div className="product-detail-price">{product.price === null ? <strong>Price on enquiry</strong> : <><strong>{formatCurrency(product.price)}</strong>{discounted && <><del>{formatCurrency(product.compare_at_price)}</del><span className="product-save">{Math.round((1 - product.price / product.compare_at_price!) * 100)}% off</span></>}</>}</div>
        {product.description && <p className="product-detail-description">{product.description}</p>}
        {available ? <ProductPurchaseControls productId={product.id} available={available} stockQuantity={product.stock_quantity} /> : <p className="product-unavailable-message">This item is currently unavailable to add to cart. Contact the store for an update.</p>}
        <Button variant="outline" className="product-whatsapp-button" asChild><a href={whatsappHref("918506006504", whatsappMessage)} target="_blank" rel="noopener noreferrer">Ask about this product on WhatsApp <ArrowUpRight size={16} /></a></Button>
        <div className="product-assurances"><span><ShieldCheck size={17} /> Genuine product information</span><span><Check size={17} /> Store confirms stock and delivery</span></div>
      </div>
    </div></section>
    {specs.length > 0 && <section className="product-spec-section"><div className="container product-spec-grid"><div><span className="eyebrow">Product details</span><h2>Specifications</h2><p>Specifications are maintained by Adarsh Computers and may vary by model or stock batch.</p></div><dl className="product-spec-list">{specs.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl></div></section>}
    <section className="product-detail-back"><div className="container"><Button variant="ghost" asChild><Link href="/products"><ArrowLeft size={16} /> Back to products</Link></Button></div></section>
  </>;
}
