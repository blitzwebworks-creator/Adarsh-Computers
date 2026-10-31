import type { ReactNode } from "react";

export function SectionTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="section-title-row"><div><span className="eyebrow">{eyebrow}</span><h2 className="section-title">{title}</h2>{description && <p className="section-description">{description}</p>}</div>{action}</div>;
}
