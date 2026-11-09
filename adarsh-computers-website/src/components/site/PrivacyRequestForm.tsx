"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { PRIVACY_NOTICE_VERSION } from "@/lib/privacy";

export function PrivacyRequestForm() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || sent) return;
    setPending(true);
    setMessage("");
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/privacy-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The request could not be submitted.");
      setSent(true);
      setReference(typeof result.request_id === "string" ? result.request_id : "");
      setMessage("Your request has been received. We may contact you to verify your identity before taking action or sharing account information.");
      form.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The request could not be submitted. Please contact the store.");
    } finally {
      setPending(false);
    }
  }

  return <form className="contact-form privacy-request-form" onSubmit={submit}>
    <div className="form-grid">
      <label>Name<Input name="full_name" autoComplete="name" minLength={2} maxLength={120} required /></label>
      <label>Email used with the website, if any<Input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <label className="form-span">What would you like help with?<select name="request_type" className="privacy-request-select" required defaultValue=""><option value="" disabled>Select a request</option><option>Access a copy</option><option>Correct details</option><option>Delete account or details</option><option>Withdraw consent</option><option>Other privacy concern</option></select></label>
      <label className="form-span">Details<Textarea name="details" minLength={10} maxLength={2000} required placeholder="Tell us which account, enquiry or order this concerns. Do not include your password or payment credentials." /></label>
    </div>
    <label className="contact-honeypot" aria-hidden="true">Leave this field empty<Input name="website" tabIndex={-1} autoComplete="off" /></label>
    <input type="hidden" name="privacy_notice_version" value={PRIVACY_NOTICE_VERSION} />
    <label className="privacy-consent-row"><input name="privacy_consent" type="checkbox" required />I agree that Adarsh Computers may use these details to review and respond to this privacy request as described in the <Link href="/privacy-policy">privacy notice</Link>.</label>
    <p className="privacy-form-note">We use these details to handle this request. We may verify your identity before disclosing or changing personal information.</p>
    <div className="form-submit-row"><Button type="submit" size="lg" disabled={pending || sent} aria-busy={pending}>{pending ? <>Sending request <LoaderCircle className="spin" size={16} /></> : sent ? <>Request sent <Check size={16} /></> : <>Submit privacy request <ArrowRight size={17} /> </>}</Button><p aria-live="polite" className={message && !sent ? "form-message form-error" : "form-message"}>{message}{reference && <><br /><strong>Reference: {reference}</strong></>}</p></div>
  </form>;
}
