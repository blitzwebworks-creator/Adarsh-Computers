import { MessageCircle } from "lucide-react";
import { whatsappHref } from "@/lib/utils";

export function FloatingWhatsApp() {
  const href = whatsappHref("918506006504", "Hello Adarsh Computers, I have a general enquiry.");
  return <a className="floating-whatsapp" href={href} target="_blank" rel="noopener noreferrer" aria-label="Send a general enquiry to Adarsh Computers on WhatsApp">
    <MessageCircle size={21} aria-hidden="true" /><span>Chat on WhatsApp</span>
  </a>;
}
