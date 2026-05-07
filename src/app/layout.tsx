import type { Metadata } from "next";
import { Cinzel, El_Messiri } from "next/font/google";
import "./globals.css";
import { SiteProviders } from "@/components/SiteProviders";
import FloatingWhatsapp from "@/components/FloatingWhatsapp";

const displayFont = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const bodyFont = El_Messiri({
  variable: "--font-body",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Joox Fashion | Egyptian Street Luxury",
  description:
    "Joox Fashion blends Egyptian-inspired luxury with modern streetwear.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-obsidian text-sand text-[1.03rem]">
        <SiteProviders>
          {children}
          <FloatingWhatsapp />
        </SiteProviders>
      </body>
    </html>
  );
}
