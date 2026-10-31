export default function ProductsLoading() {
  return <section className="section-padding" aria-label="Loading products"><div className="container"><div className="store-loading" role="status"><span className="loading-spinner" /> Loading products…</div><div className="product-skeleton-grid">{Array.from({ length: 8 }, (_, index) => <div className="product-skeleton" key={index}><span /><i /><i /><i /></div>)}</div></div></section>;
}
