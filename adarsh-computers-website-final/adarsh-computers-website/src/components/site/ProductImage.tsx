"use client";

import Image from "next/image";
import { useState } from "react";
import { Box } from "lucide-react";

type ProductImageProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
};

export function ProductImage({ src, alt, sizes, className, priority = false }: ProductImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return <>
    {!loaded && !failed && <span className="product-image-loading" aria-hidden="true" />}
    {failed ? <span className="product-image-fallback" aria-label="Image unavailable"><Box size={28} strokeWidth={1.3} /></span> : <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      style={{ opacity: loaded ? 1 : 0 }}
    />}
  </>;
}
