import Link from "next/link";
import { ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCategories, getProducts } from "@/lib/data";

export const metadata = { title: "Products", description: "Browse the Adarsh Computers product catalogue in Nehru Place, New Delhi." };
type SearchParams = Promise<{ q?: string; category?: string; sort?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [categories, products] = await Promise.all([getCategories(), getProducts({ search: params.q, categorySlug: params.category, sort: params.sort })]);
  return <>
    <section className="page-hero"><div className="container page-hero-inner"><span className="eyebrow">The catalogue</span><h1>Products for the way you work.</h1><p>Explore the store’s current computer hardware and peripheral listings. Availability and prices are confirmed by the store.</p><div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><span>Products</span></div></div></section>
    <section className="section-padding"><div className="container">
      <form className="catalogue-toolbar" action="/products"><label className="search-field"><Search size={17} /><Input name="q" defaultValue={params.q || ""} placeholder="Search products" aria-label="Search products" /></label><label className="category-filter"><SlidersHorizontal size={17} /><select name="category" defaultValue={params.category || ""} aria-label="Filter by category"><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</select></label><label className="category-filter"><select name="sort" defaultValue={params.sort || "recent"} aria-label="Sort products"><option value="recent">Recently added</option><option value="name">Name A–Z</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label><Button type="submit">Search <ArrowUpRight size={16} /></Button></form>
      {categories.length > 0 && <div className="filter-chips"><Link href="/products" className={!params.category ? "filter-chip active" : "filter-chip"}>All products</Link>{categories.map((category) => <Link key={category.id} href={"/products?category=" + category.slug} className={params.category === category.slug ? "filter-chip active" : "filter-chip"}>{category.name}</Link>)}</div>}
      {products.length ? <div className="product-grid product-grid-page">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="catalogue-empty page-empty"><span className="empty-icon"><Search size={22} /></span><div><strong>No published products match this search.</strong><p>Try another search or contact us to ask about availability.</p></div><Button variant="outline" asChild><Link href="/contact">Ask the store <ArrowUpRight size={16} /></Link></Button></div>}
    </div></section>
  </>;
}

