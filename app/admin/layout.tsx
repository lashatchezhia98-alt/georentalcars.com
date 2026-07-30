import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private administration",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
