import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { cancellationRequestRateLimited, customerCancellationAllowed, generateCancellationToken, hashCancellationToken, hashRateLimitKey } from "@/lib/cancellation";
import { sendCancellationLinkEmail } from "@/lib/email";

const schema = z.object({ bookingCode: z.string().trim().toUpperCase().regex(/^GRC-[A-Z0-9]{6,12}$/) });
const generic = { ok: true };

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(generic);

  const code = parsed.data.bookingCode;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const secret = process.env.CANCELLATION_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (!secret) return NextResponse.json(generic);
  const ipKey = hashRateLimitKey(`ip:${ip}`, secret);
  const codeKey = hashRateLimitKey(`code:${code}`, secret);
  const windowStart = new Date(Date.now() - 15 * 60_000);
  const [ipAttempts, codeAttempts] = await Promise.all([
    prisma.cancellationRequestAttempt.count({ where: { keyHash: ipKey, createdAt: { gte: windowStart } } }),
    prisma.cancellationRequestAttempt.count({ where: { keyHash: codeKey, createdAt: { gte: windowStart } } }),
  ]);
  if (cancellationRequestRateLimited(ipAttempts, codeAttempts)) return NextResponse.json(generic);

  await prisma.cancellationRequestAttempt.createMany({ data: [{ keyHash: ipKey }, { keyHash: codeKey }] });
  const booking = await prisma.booking.findUnique({
    where: { bookingCode: code },
    select: { id: true, bookingCode: true, customerEmail: true, customerLanguage: true, status: true, returnedAt: true, startDate: true, pickupTime: true },
  });
  if (!booking || !customerCancellationAllowed(booking)) return NextResponse.json(generic);

  const rawToken = generateCancellationToken();
  const ttl = Math.min(60, Math.max(5, Number(process.env.CANCELLATION_TOKEN_TTL_MINUTES) || 30));
  await prisma.bookingCancellationToken.create({
    data: { bookingId: booking.id, tokenHash: hashCancellationToken(rawToken), expiresAt: new Date(Date.now() + ttl * 60_000) },
  });

  // Fragment tokens are not sent in HTTP URLs and therefore stay out of access logs.
  const secureUrl = `${process.env.NEXTAUTH_URL || "https://georentalcars.com"}/cancel-booking#token=${encodeURIComponent(rawToken)}`;
  await sendCancellationLinkEmail({ language: booking.customerLanguage, customerEmail: booking.customerEmail, bookingCode: booking.bookingCode, secureUrl })
    .catch(() => console.error("Cancellation link email delivery failed"));
  return NextResponse.json(generic);
}
