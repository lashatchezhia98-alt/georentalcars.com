import type { Metadata } from "next";
import CancelBooking from "@/components/CancelBooking";

export const metadata: Metadata = {
  title: "Cancel booking",
  description: "Securely request and confirm cancellation of a GeoRentalCars booking.",
  robots: { index: true, follow: true },
};

export default function CancelBookingPage() {
  return <CancelBooking />;
}
