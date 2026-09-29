import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cutoff = new Date();
  cutoff.setUTCMonth(cutoff.getUTCMonth() - 2);
  const [result, attempts, tokens] = await prisma.$transaction([
    prisma.booking.deleteMany({ where: { status: "CONFIRMED", endDate: { lt: cutoff } } }),
    prisma.cancellationRequestAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60_000) } } }),
    prisma.bookingCancellationToken.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60_000) } } }),
  ]);
  return NextResponse.json({ deleted: result.count, rateLimitAttemptsDeleted: attempts.count, tokensDeleted: tokens.count });
}
