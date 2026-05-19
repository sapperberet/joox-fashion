import type { Metadata } from "next";
import { Cinzel, El_Messiri } from "next/font/google";
import "./globals.css";
import { SiteProviders } from "@/components/SiteProviders";
import FloatingWhatsapp from "@/components/FloatingWhatsapp";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://joox.name";

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
  metadataBase: new URL(siteUrl),
  title: "Joox | High-Quality Fashion",
  description:
    "Shop the latest fashion trends and exclusive collections at Joox.",
  openGraph: {
    title: "Joox Fashion",
    description: "Shop the latest fashion trends and exclusive collections at Joox.",
    url: siteUrl,
    siteName: "Joox",
    images: [
      {
        url: "/joox-fashion.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Joox Fashion",
    description: "Shop the latest fashion trends and exclusive collections at Joox.",
    images: ["/joox-fashion.png"],
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/joox-icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/joox-icon.png",
  },
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
