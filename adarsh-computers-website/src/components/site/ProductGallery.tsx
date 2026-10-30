"use client";

import Image from "next/image";
import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(images[0] || "");
  if (images.length === 0) return <div className="product-gallery-empty"><ImageIcon size={42} strokeWidth={1.3} /><span>Product image coming soon</span></div>;
  return <div className="product-gallery">
    <div className="product-gallery-main"><Image src={selected} alt={name} fill priority sizes="(max-width: 760px) 100vw, 55vw" /></div>
    {images.length > 1 && <div className="product-gallery-thumbs" aria-label="Product images">{images.map((image, index) => <button type="button" key={image} onClick={() => setSelected(image)} className={selected === image ? "selected" : ""} aria-label={"Show image " + (index + 1)} aria-pressed={selected === image}><Image src={image} alt="" fill sizes="80px" /></button>)}</div>}
  </div>;
}
