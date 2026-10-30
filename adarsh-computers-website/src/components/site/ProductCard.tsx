import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Box } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const price = formatCurrency(product.price);
  const href = "/products/" + product.id;
  return <article className="product-card">
    <Link href={href} className="product-visual" aria-label={"Enquire about " + product.name}>
      {product.image_url ? <Image src={product.image_url} alt={product.name} fill sizes="(max-width: 680px) 100vw, (max-width: 1000px) 50vw, 25vw" className="product-photo" /> : <div className="product-placeholder"><Box size={36} strokeWidth={1.2} /><span>Product image</span></div>}
      {product.is_featured && <Badge className="featured-badge">Featured</Badge>}
    </Link>
    <div className="product-details"><div className="product-meta"><span>{product.brand || product.categories?.name || "Hardware"}</span><span className="availability-dot">{product.availability}</span></div><h3>{product.name}</h3>{product.description && <p>{product.description}</p>}
      <div className="product-bottom"><strong>{price || "Price on enquiry"}</strong><Link href={href} aria-label={"View " + product.name}><ArrowUpRight size={17} /></Link></div>
    </div>
  </article>;
}
