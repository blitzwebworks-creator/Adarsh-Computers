import Link from "next/link";
import { ArrowUpRight, Box } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/site/ProductImage";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const price = formatCurrency(product.price);
  const availability = product.stock_quantity === 0 ? "Out of stock" : product.availability;
  const image = product.image_url || product.image_urls?.[0] || null;
  const href = "/products/" + product.id;
  return <article className="product-card">
    <Link href={href} className="product-visual" aria-label={"Enquire about " + product.name}>
      {image ? <ProductImage key={image} src={image} alt={product.name} sizes="(max-width: 680px) 100vw, (max-width: 1000px) 50vw, 25vw" className="product-photo" /> : <div className="product-placeholder"><Box size={36} strokeWidth={1.2} /><span>Product image</span></div>}
      {product.is_featured && <Badge className="featured-badge">Featured</Badge>}
    </Link>
    <div className="product-details"><div className="product-meta"><span>{product.brand || product.categories?.name || "Hardware"}</span><span className="availability-dot">{availability}</span></div><h3>{product.name}</h3>{product.description && <p>{product.description}</p>}
      <div className="product-bottom"><strong>{price || "Price on enquiry"}</strong><Link href={href} aria-label={"View " + product.name}><ArrowUpRight size={17} /></Link></div>
    </div>
  </article>;
}
