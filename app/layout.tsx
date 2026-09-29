import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://georentalcars.com"),
  title: { default: "GeoRentalCars.com — Explore Georgia Your Way", template: "%s | GeoRentalCars.com" },
  description: "Premium, transparent car rental in Georgia. Book an adventure-ready vehicle in minutes.",
  icons: {
    icon: [{ url: "/favicon.svg?v=2", type: "image/svg+xml" }],
    shortcut: "/favicon.svg?v=2",
    apple: "/favicon.svg?v=2",
  },
  openGraph: {
    title: "GeoRentalCars.com — Georgia, your way.",
    description: "Adventure-ready cars. Transparent pricing. Local support.",
    images: ["/og.png"],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#10172d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka">
      <body>{children}</body>
    </html>
  );
}
