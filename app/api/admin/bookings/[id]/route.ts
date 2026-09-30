import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBookingStatusEmail } from "@/lib/email";
import { createDirectCancellationUrl } from "@/lib/cancellation-link";

const schema = z.object({ status: z.enum(["CONFIRMED", "REJECTED"]) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const { id } = await context.params;
  const booking = await prisma.booking.findUnique({ where: { id }, include: { car: { include: { category: true } }, promoCode: true } });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status === "CANCELLED_BY_CUSTOMER" || booking.returnedAt) {
    return NextResponse.json({ error: "გაუქმებული ან დასრულებული ჯავშნის სტატუსის შეცვლა შეუძლებელია." }, { status: 409 });
  }
  const role = (session.user as { role?: string }).role || "LIMITED";
  if (booking.status === "CONFIRMED" && parsed.data.status === "REJECTED" && role !== "FULL") {
    return NextResponse.json({ error: "დადასტურებული ჯავშნის უარყოფა მხოლოდ მთავარ მფლობელს შეუძლია." }, { status: 403 });
  }
  if (booking.status === parsed.data.status && booking.statusEmailSentFor === parsed.data.status) {
    return NextResponse.json({ id: booking.id, status: booking.status, emailSent: true, duplicate: true });
  }
  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      if (parsed.data.status === "CONFIRMED") {
        const conflict = await tx.booking.findFirst({
          where: { id: { not: id }, carId: booking.carId, status: "CONFIRMED", startDate: { lte: booking.endDate }, endDate: { gte: booking.startDate } },
          select: { id: true },
        });
        if (conflict) throw new Error("booking-conflict");
      }
      return tx.booking.update({
        where: { id },
        data: {
          status: parsed.data.status,
          ...(booking.status !== parsed.data.status ? { statusEmailSentFor: null, statusEmailSentAt: null } : {}),
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5_000, timeout: 10_000 });
  } catch (error) {
    if (error instanceof Error && error.message === "booking-conflict") {
      return NextResponse.json({ error: "This car already has a confirmed booking for these dates" }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return NextResponse.json({ error: "Another booking update is in progress. Please try again." }, { status: 409 });
    }
    throw error;
  }
  const cancellationPageUrl = parsed.data.status === "CONFIRMED"
    ? await createDirectCancellationUrl({ id: booking.id, startDate: booking.startDate, pickupTime: booking.pickupTime })
    : `${process.env.NEXTAUTH_URL || "https://georentalcars.com"}/cancel-booking`;
  try {
    await sendBookingStatusEmail({
      language: booking.customerLanguage,
      bookingCode: booking.bookingCode,
      cancellationPageUrl,
      status: parsed.data.status,
      customerEmail: booking.customerEmail,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      birthDate: booking.birthDate.toISOString().slice(0,10),
      flightNumber: booking.flightNumber || "—",
      passportNumber: booking.passportNumber || "—",
      driverLicenseNumber: booking.driverLicenseNumber || "—",
      carName: booking.car.name,
      carCategory: booking.car.category.name,
      startDate: booking.startDate.toISOString().slice(0, 10),
      endDate: booking.endDate.toISOString().slice(0, 10),
      pickupTime: booking.pickupTime || "—",
      returnTime: booking.returnTime || "—",
      pickupLocation: booking.pickupLocation,
      pickupFee: Number(booking.pickupFee),
      returnLocation: booking.returnLocation,
      returnFee: Number(booking.returnFee),
      totalDays: booking.totalDays,
      dailyPrice: Number(booking.dailyPrice),
      rentalDiscount: Number(booking.discountPercent),
      promoCode: booking.promoCode?.code || "—",
      promoDiscount: Number(booking.promoDiscountPercent),
      totalPrice: Number(booking.totalPrice),
    });
  } catch {
    return NextResponse.json({
      error: "სტატუსი შეიცვალა, მაგრამ კლიენტისთვის იმეილის გაგზავნა ვერ მოხერხდა. იმავე სტატუსს ხელახლა დააჭირეთ.",
      id: updated.id, status: updated.status, emailSent: false,
    }, { status: 502 });
  }
  await prisma.booking.update({
    where: { id },
    data: { statusEmailSentFor: parsed.data.status, statusEmailSentAt: new Date() },
  });
  return NextResponse.json({ id: updated.id, status: updated.status, emailSent: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const booking = await prisma.booking.findUnique({ where: { id }, select: { status: true } });
  if (!booking) return NextResponse.json({ error: "ჯავშანი ვერ მოიძებნა." }, { status: 404 });
  if (!["REJECTED", "CANCELLED_BY_CUSTOMER"].includes(booking.status)) {
    return NextResponse.json({ error: "ხელით მხოლოდ უარყოფილი ან მომხმარებლის მიერ გაუქმებული ჯავშნის წაშლა შეიძლება." }, { status: 409 });
  }
  await prisma.booking.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
