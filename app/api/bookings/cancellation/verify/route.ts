import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { cancellationTokenState, customerCancellationAllowed, hashCancellationToken } from "@/lib/cancellation";

const schema = z.object({ token: z.string().min(40).max(100), language: z.enum(["en", "ka", "ru", "ar"]).optional() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ state: "invalid" }, { status: 400 });
  const record = await prisma.bookingCancellationToken.findUnique({
    where: { tokenHash: hashCancellationToken(parsed.data.token) },
    include: { booking: { include: { car: true } } },
  });
  if (!record) return NextResponse.json({ state: "invalid" }, { status: 404 });
  const state = cancellationTokenState({ usedAt: record.usedAt, expiresAt: record.expiresAt, bookingAllowed: customerCancellationAllowed(record.booking) });
  if (state !== "valid") return NextResponse.json({ state }, { status: 409 });

  const [pickup, dropoff] = await Promise.all([
    prisma.pickupLocation.findUnique({ where: { id: record.booking.pickupLocation } }),
    prisma.pickupLocation.findUnique({ where: { id: record.booking.returnLocation } }),
  ]);
  const language = parsed.data.language || "en";
  const locationName = (location: typeof pickup) => location
    ? ({ ka: location.nameKa, en: location.nameEn, ru: location.nameRu, ar: location.nameAr })[language]
    : "—";
  return NextResponse.json({
    state: "valid",
    booking: {
      bookingCode: record.booking.bookingCode,
      car: record.booking.car.name,
      startDate: record.booking.startDate.toISOString().slice(0, 10),
      endDate: record.booking.endDate.toISOString().slice(0, 10),
      pickupTime: record.booking.pickupTime || "—",
      returnTime: record.booking.returnTime || "—",
      pickupLocation: locationName(pickup),
      returnLocation: locationName(dropoff),
      status: record.booking.status,
      cancellationFee: 0,
    },
  });
}
