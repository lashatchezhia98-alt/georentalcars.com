import { NextResponse } from "next/server";
import { bookingSchema } from "@/lib/validation";
import { calculatePrice, durationDiscount, rentalDays } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { sendBookingEmails } from "@/lib/email";

const recent = new Map<string, number>();

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const now = Date.now();
  if (now - (recent.get(ip) || 0) < 2500) {
    return NextResponse.json({ error: "Please wait before trying again." }, { status: 429 });
  }
  recent.set(ip, now);

  const parsed = bookingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid booking details", fields: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const start = new Date(`${data.startDate}T00:00:00Z`);
  const end = new Date(`${data.endDate}T00:00:00Z`);
  const birthDate = new Date(`${data.birthDate}T00:00:00Z`);
  const driverLicenseExpiry = new Date(`${data.driverLicenseExpiry}T00:00:00Z`);
  const days = rentalDays(start, end);
  const adultCutoff = new Date();
  adultCutoff.setUTCFullYear(adultCutoff.getUTCFullYear() - 18);

  if (!days || days > 365 || start < new Date(new Date().toISOString().slice(0, 10))) {
    return NextResponse.json({ error: "Invalid rental period" }, { status: 400 });
  }
  if (birthDate > adultCutoff) {
    return NextResponse.json({ error: "The driver must be at least 18 years old" }, { status: 400 });
  }
  if (driverLicenseExpiry < end) {
    return NextResponse.json({ error: "Driver’s license must remain valid through the rental end date" }, { status: 400 });
  }

  const [car, pickup, discountSettings, promo, conflict] = await Promise.all([
    prisma.car.findFirst({ where: { id: data.carId, isAvailable: true }, include: { category: true } }),
    prisma.pickupLocation.findFirst({ where: { id: data.pickupLocation, isActive: true } }),
    prisma.discountSettings.findUnique({ where: { id: "default" } }),
    data.promoCode
      ? prisma.promoCode.findFirst({ where: { code: data.promoCode.toUpperCase(), isActive: true } })
      : Promise.resolve(null),
    prisma.booking.findFirst({
      where: { carId: data.carId, status: "CONFIRMED", startDate: { lte: end }, endDate: { gte: start } },
      select: { id: true },
    }),
  ]);
  if (!car) return NextResponse.json({ error: "Car not found or unavailable" }, { status: 404 });
  if (!pickup) return NextResponse.json({ error: "Pickup location not found" }, { status: 404 });
  if (conflict) return NextResponse.json({ error: "This car is unavailable for the selected dates" }, { status: 409 });
  if (data.promoCode && !promo) return NextResponse.json({ error: "Promo code is invalid or inactive" }, { status: 400 });

  const rentalDiscount = durationDiscount(days, discountSettings ? {
    startDay: discountSettings.startDay,
    basePercent: Number(discountSettings.basePercent),
    incrementPerDay: Number(discountSettings.incrementPerDay),
    maxPercent: Number(discountSettings.maxPercent),
  } : undefined);
  const promoDiscount = promo ? Number(promo.discountPercent) : 0;
  const dailyPrice = Number(car.dailyPrice);
  const pickupFee = Number(pickup.fee);
  const rentalTotal = calculatePrice(days, dailyPrice, rentalDiscount, promoDiscount);
  const totalPrice = rentalTotal + pickupFee;

  const booking = await prisma.booking.create({
    data: {
      carId: car.id,
      customerName: `${data.firstName} ${data.lastName}`,
      customerPhone: data.phone,
      customerEmail: data.email.toLowerCase(),
      birthDate,
      passportNumber: data.passportNumber.toUpperCase(),
      driverLicenseNumber: data.driverLicenseNumber.toUpperCase(),
      driverLicenseExpiry,
      customerLanguage: data.language,
      pickupLocation: pickup.id,
      pickupFee,
      startDate: start,
      endDate: end,
      totalDays: days,
      dailyPrice,
      discountPercent: rentalDiscount,
      promoDiscountPercent: promoDiscount,
      totalPrice,
      promoCodeId: promo?.id,
      promoUsage: promo ? { create: { promoCodeId: promo.id } } : undefined,
    },
  });

  await sendBookingEmails({
    language: data.language,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    customerEmail: booking.customerEmail,
    carName: car.name,
    carCategory: car.category.name,
    startDate: data.startDate,
    endDate: data.endDate,
    pickupLocation: pickup.nameEn,
    totalPrice,
  }).catch(() => undefined);

  return NextResponse.json({
    id: booking.id,
    status: booking.status,
    totalPrice,
    pickupFee,
    totalDays: days,
    discountPercent: rentalDiscount,
    promoDiscountPercent: promoDiscount,
  }, { status: 201 });
}
