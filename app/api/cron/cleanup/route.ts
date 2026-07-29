import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const result = await prisma.booking.deleteMany({ where: { returnedAt: { not: null, lt: cutoff } } });
  return NextResponse.json({ deleted: result.count });
}
