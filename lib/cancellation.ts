import { createHash, randomBytes } from "node:crypto";

const bookingAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateBookingCode(random = randomBytes) {
  const bytes = random(6);
  let suffix = "";
  for (let index = 0; index < 6; index += 1) suffix += bookingAlphabet[bytes[index] % bookingAlphabet.length];
  return `GRC-${suffix}`;
}

export function generateCancellationToken(random = randomBytes) {
  return random(32).toString("base64url");
}

export function hashCancellationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashRateLimitKey(value: string, secret: string) {
  return createHash("sha256").update(`${secret}:${value}`).digest("hex");
}

export function cancellationRequestRateLimited(ipAttempts: number, codeAttempts: number) {
  return ipAttempts >= 5 || codeAttempts >= 3;
}

export function normalizeBookingCode(value: string) {
  const code = value.trim().toUpperCase();
  return /^GRC-[A-Z0-9]{6,12}$/.test(code) ? code : null;
}

export function pickupMoment(startDate: Date, pickupTime?: string | null) {
  const [hours, minutes] = (pickupTime || "00:00").split(":").map(Number);
  // Georgia is UTC+4 year-round, so local pickup time is four hours ahead of UTC.
  return new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate(), hours - 4, minutes));
}

export function customerCancellationAllowed(booking: {
  status: string; returnedAt?: Date | null; startDate: Date; pickupTime?: string | null;
}, now = new Date()) {
  return ["PENDING", "CONFIRMED"].includes(booking.status)
    && !booking.returnedAt
    && pickupMoment(booking.startDate, booking.pickupTime) > now;
}

export function cancellationTokenState(input: {
  usedAt?: Date | null; expiresAt: Date; bookingAllowed: boolean;
}, now = new Date()) {
  if (input.usedAt) return "used" as const;
  if (input.expiresAt <= now) return "expired" as const;
  if (!input.bookingAllowed) return "closed" as const;
  return "valid" as const;
}

export function customerCancellationData(now = new Date()) {
  return { status: "CANCELLED_BY_CUSTOMER" as const, cancelledAt: now, cancellationSource: "CUSTOMER_SELF_SERVICE" as const };
}

export const cancellationGenericResponse =
  "თუ მითითებული კოდით ჯავშანი არსებობს, გაუქმების ბმული გამოგზავნილია ჯავშანში დაფიქსირებულ ელფოსტაზე.";
