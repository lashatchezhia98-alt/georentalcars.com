import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { cancellationTokenState, customerCancellationAllowed, customerCancellationData, hashCancellationToken } from "@/lib/cancellation";
import { sendCancellationConfirmationEmails } from "@/lib/email";

const schema = z.object({ token: z.string().min(40).max(100) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ state: "invalid" }, { status: 400 });
  const tokenHash = hashCancellationToken(parsed.data.token);
  const now = new Date();

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const record = await tx.bookingCancellationToken.findUnique({
        where: { tokenHash },
        include: { booking: { include: { car: true } } },
      });
      if (!record) throw new Error("invalid");
      const state = cancellationTokenState({ usedAt: record.usedAt, expiresAt: record.expiresAt, bookingAllowed: customerCancellationAllowed(record.booking, now) }, now);
      if (state !== "valid") throw new Error(state);

      const claimed = await tx.bookingCancellationToken.updateMany({
        where: { id: record.id, usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now },
      });
      if (claimed.count !== 1) throw new Error("used");
      const cancelled = await tx.booking.updateMany({
        where: { id: record.bookingId, status: { in: ["PENDING", "CONFIRMED"] }, returnedAt: null, cancelledAt: null },
        data: customerCancellationData(now),
      });
      if (cancelled.count !== 1) throw new Error("closed");
      await tx.bookingCancellationToken.updateMany({ where: { bookingId: record.bookingId, usedAt: null }, data: { usedAt: now } });
      return { ...record.booking, status: "CANCELLED_BY_CUSTOMER" as const, cancelledAt: now };
    });

    const [pickup, dropoff] = await Promise.all([
      prisma.pickupLocation.findUnique({ where: { id: booking.pickupLocation } }),
      prisma.pickupLocation.findUnique({ where: { id: booking.returnLocation } }),
    ]);
    const emailDelivery = await sendCancellationConfirmationEmails({
      language: booking.customerLanguage,
      customerEmail: booking.customerEmail,
      bookingCode: booking.bookingCode,
      carName: booking.car.name,
      startDate: booking.startDate.toISOString().slice(0, 10),
      endDate: booking.endDate.toISOString().slice(0, 10),
      pickupLocation: pickup?.nameEn || booking.pickupLocation,
      returnLocation: dropoff?.nameEn || booking.returnLocation,
      cancelledAt: now.toISOString(),
    }).catch((error) => {
      console.error("Cancellation confirmation email delivery failed", error instanceof Error ? error.message : "Unknown mail error");
      return { customerSent: false, adminSent: false };
    });
    return NextResponse.json({ state: "cancelled", bookingCode: booking.bookingCode, emailSent: emailDelivery.customerSent, adminEmailSent: emailDelivery.adminSent });
  } catch (error) {
    const state = error instanceof Error && ["invalid", "expired", "used", "closed"].includes(error.message) ? error.message : "invalid";
    return NextResponse.json({ state }, { status: state === "invalid" ? 404 : 409 });
  }
}
