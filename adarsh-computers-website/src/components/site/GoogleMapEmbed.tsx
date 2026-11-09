"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

export function GoogleMapEmbed({ src, title }: { src: string; title: string }) {
  const [enabled, setEnabled] = useState(false);
  if (enabled) return <iframe title={title} src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />;
  return <div className="map-consent-card"><MapPin size={21} aria-hidden="true" /><p>The map is provided by Google. Load it only if you want Google to receive your connection details.</p><button type="button" onClick={() => setEnabled(true)}>Load map</button></div>;
}
