import Link from "next/link";
import { ArrowUpRight, Cpu, HardDrive, Laptop, Monitor, Mouse, Network, Printer } from "lucide-react";
import type { Category } from "@/lib/types";

function CategoryIcon({ name }: { name: string }) {
  const value = name.toLowerCase();
  if (value.includes("laptop")) return <Laptop />;
  if (value.includes("monitor") || value.includes("desktop")) return <Monitor />;
  if (value.includes("storage") || value.includes("ssd") || value.includes("hdd")) return <HardDrive />;
  if (value.includes("network")) return <Network />;
  if (value.includes("printer")) return <Printer />;
  if (value.includes("keyboard") || value.includes("mouse")) return <Mouse />;
  return <Cpu />;
}

export function CategoryCard({ category }: { category: Category }) {
  return <Link href={"/products?category=" + encodeURIComponent(category.slug)} className="category-card"><span className="category-icon"><CategoryIcon name={category.name} /></span><span className="category-copy"><strong>{category.name}</strong>{category.description && <small>{category.description}</small>}</span><ArrowUpRight className="category-arrow" size={18} /></Link>;
}
