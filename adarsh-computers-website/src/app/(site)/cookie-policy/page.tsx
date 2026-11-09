import Link from "next/link";

export const metadata = { title: "Cookies and browser storage" };

export default function CookiePolicyPage() {
  return <section className="section-padding legal-page"><div className="container legal-document">
    <span className="eyebrow">Privacy controls</span><h1>Cookies and browser storage</h1>
    <p className="prose-copy">This website currently uses browser storage and essential session cookies to provide the features you request.</p>
    <h2>Essential sign-in cookies</h2><p className="prose-copy">Supabase Auth uses cookies to maintain your sign-in session and refresh it securely. Choosing “Remember me” gives that session a longer browser-cookie lifetime. These cookies are necessary for account, checkout and administrator access.</p>
    <h2>Shopping cart</h2><p className="prose-copy">The cart is stored in your browser’s local storage so it can remain available when you move between pages or return to the site. You can clear it using the cart controls or your browser’s site-data settings.</p>
    <h2>Google Maps</h2><p className="prose-copy">The embedded map is not loaded until you choose “Load map”. Google may then receive technical information from your browser and use its own cookies or similar technologies. You can instead use the external directions link without loading the embed.</p>
    <h2>Optional tracking</h2><p className="prose-copy">The current website does not intentionally load advertising pixels or analytics trackers. If this changes, this notice and any required consent controls should be updated before those tools are enabled.</p>
    <p className="prose-copy">See the <Link href="/privacy-policy">privacy notice</Link> for more information about personal information and contact options.</p>
  </div></section>;
}
