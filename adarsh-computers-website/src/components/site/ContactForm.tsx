"use client";
import { useState, type FormEvent } from "react";
import { ArrowUpRight, Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm({ initialInterested = "" }: { initialInterested?: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/enquiries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We could not send your enquiry.");
      setSent(true);
      setMessage("Thanks. Your enquiry has been received.");
      form.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not send your enquiry. Please call the store.");
    } finally {
      setPending(false);
    }
  }

  return <form className="contact-form" onSubmit={submit}>
    <div className="form-grid">
      <label>Name<Input name="name" autoComplete="name" minLength={2} maxLength={120} required placeholder="Your name" /></label>
      <label>Phone<Input name="phone" autoComplete="tel" minLength={7} maxLength={30} required placeholder="Your contact number" /></label>
      <label className="form-span">Email <span className="optional-label">Optional</span><Input name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" /></label>
      <label className="form-span">Product or service <span className="optional-label">Optional</span><Input name="interested_in" maxLength={160} defaultValue={initialInterested} placeholder="What are you looking for?" /></label>
      <label className="form-span">Message<Textarea name="message" minLength={10} maxLength={4000} required placeholder="Tell us a little about what you need." /></label>
    </div>
    <label className="contact-honeypot" aria-hidden="true">Leave this field empty<Input name="website" tabIndex={-1} autoComplete="off" /></label>
    <div className="form-submit-row"><Button type="submit" size="lg" disabled={pending || sent}>{pending ? <>Sending <LoaderCircle className="spin" size={16} /></> : sent ? <>Sent <Check size={16} /></> : <>Send enquiry <ArrowUpRight size={17} /></>}</Button><p aria-live="polite" className={message && !sent ? "form-message form-error" : "form-message"}>{message}</p></div>
  </form>;
}
