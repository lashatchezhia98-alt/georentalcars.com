import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXTAUTH_URL || "https://georentalcars.com";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/cancel-booking`, changeFrequency: "monthly", priority: 0.4 },
  ];
}
