function Lines({ count = 3 }: { count?: number }) {
  return <div className="loading-lines" aria-hidden="true">{Array.from({ length: count }, (_, index) => <i key={index} />)}</div>;
}

export function SitePageSkeleton() {
  return <div className="page-loading-skeleton" aria-label="Loading page" role="status">
    <div className="loading-skeleton-hero"><i /><b /><b /><span /></div>
    <div className="loading-skeleton-content"><i className="loading-skeleton-heading" /><div className="loading-skeleton-grid">{Array.from({ length: 3 }, (_, index) => <div className="loading-skeleton-card" key={index}><span /><Lines count={2} /></div>)}</div></div>
  </div>;
}

export function ProductDetailSkeleton() {
  return <div className="section-padding" aria-label="Loading product" role="status"><div className="container">
    <div className="product-detail-loading-grid"><div className="product-detail-loading-image" /><div className="product-detail-loading-copy"><i /><b /><b /><span /><Lines /><span /><span /></div></div>
    <div className="loading-skeleton-content"><i className="loading-skeleton-heading" /><div className="loading-skeleton-grid">{Array.from({ length: 3 }, (_, index) => <div className="loading-skeleton-card" key={index}><Lines count={3} /></div>)}</div></div>
  </div></div>;
}

export function CartSkeleton({ checkout = false, embedded = false }: { checkout?: boolean; embedded?: boolean }) {
  const content = <div className="cart-loading-grid"><div className="cart-loading-panel"><i className="loading-skeleton-heading" />{Array.from({ length: checkout ? 4 : 3 }, (_, index) => <div className="cart-loading-row" key={index}><span /><Lines count={2} /><b /></div>)}</div><div className="cart-loading-panel cart-loading-summary"><i className="loading-skeleton-heading" /><Lines count={4} /><span /></div></div>;
  if (embedded) return <div className="cart-client-loading" aria-label={checkout ? "Loading checkout" : "Loading cart"} role="status">{content}</div>;
  return <div className="section-padding" aria-label={checkout ? "Loading checkout" : "Loading cart"} role="status"><div className="container">{content}</div></div>;
}

export function AccountSkeleton() {
  return <div className="section-padding" aria-label="Loading account and order history" role="status"><div className="container">
    <div className="account-loading-heading"><i /><span /></div><div className="account-loading-grid">{Array.from({ length: 2 }, (_, index) => <div className="cart-loading-panel" key={index}><i className="loading-skeleton-heading" /><Lines count={5} /></div>)}</div>
  </div></div>;
}

export function CustomerAuthSkeleton() {
  return <div className="section-padding" aria-label="Loading sign-in" role="status"><div className="container"><div className="customer-auth-loading"><i /><b /><b /><span /><span /><span /></div></div></div>;
}

export function AdminDashboardSkeleton() {
  return <div className="admin-loading-skeleton" aria-label="Loading admin dashboard" role="status">
    <div className="admin-loading-stats">{Array.from({ length: 4 }, (_, index) => <div className="admin-loading-stat" key={index}><i /><b /><span /></div>)}</div>
    <div className="admin-loading-panels">{Array.from({ length: 2 }, (_, panel) => <div className="admin-loading-panel" key={panel}><i />{Array.from({ length: 4 }, (_, row) => <span key={row} />)}</div>)}</div>
  </div>;
}

export function AdminSectionSkeleton() {
  return <div className="admin-loading-skeleton" aria-label="Loading admin section" role="status">
    <div className="admin-loading-panel admin-loading-form"><i />{Array.from({ length: 4 }, (_, index) => <span key={index} />)}</div>
    <div className="admin-loading-panel"><i />{Array.from({ length: 6 }, (_, index) => <span key={index} />)}</div>
  </div>;
}
