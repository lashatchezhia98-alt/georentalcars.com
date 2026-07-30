import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBookingStatusEmail } from "@/lib/email";

const schema = z.object({ status: z.enum(["CONFIRMED", "REJECTED"]) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const { id } = await context.params;
  const booking = await prisma.booking.findUnique({ where: { id }, include: { car: true } });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status === parsed.data.status && booking.statusEmailSentFor === parsed.data.status) {
    return NextResponse.json({ id: booking.id, status: booking.status, emailSent: true, duplicate: true });
  }
  if (parsed.data.status === "CONFIRMED") {
    const conflict = await prisma.booking.findFirst({
      where: { id: { not: id }, carId: booking.carId, status: "CONFIRMED", startDate: { lte: booking.endDate }, endDate: { gte: booking.startDate } },
      select: { id: true },
    });
    if (conflict) return NextResponse.json({ error: "This car already has a confirmed booking for these dates" }, { status: 409 });
  }
  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status: parsed.data.status,
      ...(booking.status !== parsed.data.status ? { statusEmailSentFor: null, statusEmailSentAt: null } : {}),
    },
  });
  try {
    await sendBookingStatusEmail({
      language: booking.customerLanguage,
      status: parsed.data.status,
      customerEmail: booking.customerEmail,
      customerName: booking.customerName,
      carName: booking.car.name,
      startDate: booking.startDate.toISOString().slice(0, 10),
      endDate: booking.endDate.toISOString().slice(0, 10),
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
