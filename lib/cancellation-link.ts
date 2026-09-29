import { prisma } from "@/lib/prisma";
import { generateCancellationToken, hashCancellationToken, pickupMoment } from "@/lib/cancellation";

export async function createDirectCancellationUrl(booking: {
  id: string;
  startDate: Date;
  pickupTime?: string | null;
}) {
  const now = new Date();
  const expiresAt = pickupMoment(booking.startDate, booking.pickupTime);
  if (expiresAt <= now) return `${process.env.NEXTAUTH_URL || "https://georentalcars.com"}/cancel-booking`;

  const rawToken = generateCancellationToken();
  await prisma.$transaction([
    prisma.bookingCancellationToken.updateMany({
      where: { bookingId: booking.id, usedAt: null },
      data: { usedAt: now },
    }),
    prisma.bookingCancellationToken.create({
      data: { bookingId: booking.id, tokenHash: hashCancellationToken(rawToken), expiresAt },
    }),
  ]);

  // A fragment is not sent to the web server, keeping the raw token out of logs.
  return `${process.env.NEXTAUTH_URL || "https://georentalcars.com"}/cancel-booking#token=${encodeURIComponent(rawToken)}`;
}
