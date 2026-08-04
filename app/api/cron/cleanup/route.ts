import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cutoff = new Date();
  cutoff.setUTCMonth(cutoff.getUTCMonth() - 2);
  const result = await prisma.booking.deleteMany({
    where: { status: "CONFIRMED", endDate: { lt: cutoff } },
  });
  return NextResponse.json({ deleted: result.count });
}
