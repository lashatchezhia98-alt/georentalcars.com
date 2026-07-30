import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ status: z.enum(["CONFIRMED", "REJECTED"]) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const { id } = await context.params;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (parsed.data.status === "CONFIRMED") {
    const conflict = await prisma.booking.findFirst({
      where: { id: { not: id }, carId: booking.carId, status: "CONFIRMED", startDate: { lte: booking.endDate }, endDate: { gte: booking.startDate } },
      select: { id: true },
    });
    if (conflict) return NextResponse.json({ error: "This car already has a confirmed booking for these dates" }, { status: 409 });
  }
  const updated = await prisma.booking.update({ where: { id }, data: { status: parsed.data.status } });
  return NextResponse.json({ id: updated.id, status: updated.status });
}
