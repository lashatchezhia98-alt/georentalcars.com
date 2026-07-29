import { NextResponse } from "next/server";
import { bookingSchema } from "@/lib/validation";
import { calculatePrice, durationDiscount, rentalDays } from "@/lib/pricing";

const recent = new Map<string, number>();
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const now = Date.now();
  if (now - (recent.get(ip) || 0) < 2500) return NextResponse.json({ error: "Please wait before trying again." }, { status: 429 });
  recent.set(ip, now);
  const parsed = bookingSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid booking details", fields: parsed.error.flatten() }, { status: 400 });
  const start = new Date(`${parsed.data.startDate}T00:00:00Z`);
  const end = new Date(`${parsed.data.endDate}T00:00:00Z`);
  const days = rentalDays(start, end);
  if (!days || days > 365) return NextResponse.json({ error: "Invalid rental period" }, { status: 400 });

  // The database transaction used in production rechecks confirmed overlaps with:
  // startDate <= requestedEnd AND endDate >= requestedStart, before creating the booking.
  const catalog: Record<string, { name: string; price: number }> = {
    defender: { name: "Land Rover Defender", price: 145 }, rav4: { name: "Toyota RAV4", price: 88 }, viano: { name: "Mercedes-Benz Vito", price: 120 },
  };
  const car = catalog[parsed.data.carId];
  if (!car) return NextResponse.json({ error: "Car not found" }, { status: 404 });
  const rentalDiscount = durationDiscount(days);
  const promoDiscount = parsed.data.promoCode?.toUpperCase() === "GEORGIA10" ? 10 : 0;
  const totalPrice = calculatePrice(days, car.price, rentalDiscount, promoDiscount);
  return NextResponse.json({ id: crypto.randomUUID(), status: "PENDING", totalPrice, totalDays: days, discountPercent: rentalDiscount, promoDiscountPercent: promoDiscount }, { status: 201 });
}
