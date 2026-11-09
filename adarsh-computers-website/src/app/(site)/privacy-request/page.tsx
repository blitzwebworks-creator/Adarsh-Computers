import type { Metadata } from "next";
import { PrivacyRequestForm } from "@/components/site/PrivacyRequestForm";

export const metadata: Metadata = { title: "Privacy request" };

export default function PrivacyRequestPage() {
  return <section className="section-padding legal-page"><div className="container legal-document">
    <span className="eyebrow">Your information</span><h1>Make a privacy request</h1>
    <p className="prose-copy">Use this form to ask about personal information associated with an account, enquiry or order. The request is sent to the store’s private administrator workspace. We may contact you to verify your identity before sharing information or taking action. Submitting a form does not immediately delete an account or order record.</p>
    <div className="privacy-request-panel surface"><PrivacyRequestForm /></div>
  </div></section>;
}
