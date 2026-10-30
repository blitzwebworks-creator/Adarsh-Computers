import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Adarsh Computers | Computer Hardware & Peripherals", template: "%s | Adarsh Computers" },
  description: "Computer hardware and peripherals in Nehru Place, New Delhi. Explore products and contact Adarsh Computers for an enquiry.",
  openGraph: { title: "Adarsh Computers", description: "Computer hardware and peripherals in Nehru Place, New Delhi.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-IN"><body>{children}<Toaster richColors position="top-right" /></body></html>;
}
