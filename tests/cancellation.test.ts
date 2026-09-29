import assert from "node:assert/strict";
import test from "node:test";
import {
  cancellationTokenState,
  cancellationRequestRateLimited,
  customerCancellationAllowed,
  customerCancellationData,
  generateBookingCode,
  generateCancellationToken,
  hashCancellationToken,
  normalizeBookingCode,
} from "../lib/cancellation.ts";

test("creates a readable booking code and a high-entropy token stored only as a hash", () => {
  const code = generateBookingCode((size) => Buffer.alloc(size, 7));
  assert.match(code, /^GRC-[A-HJ-NP-Z2-9]{6}$/);
  const token = generateCancellationToken();
  assert.ok(token.length >= 40);
  const hash = hashCancellationToken(token);
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.notEqual(hash, token);
});

test("rejects an invalid booking code without normalizing it into a valid lookup", () => {
  assert.equal(normalizeBookingCode("not-a-booking"), null);
  assert.equal(normalizeBookingCode(" grc-a7k29p "), "GRC-A7K29P");
});

test("allows a pending or confirmed future booking and builds the successful transition", () => {
  const now = new Date("2026-08-04T10:00:00.000Z");
  const booking = { status: "CONFIRMED", returnedAt: null, startDate: new Date("2026-08-05T00:00:00.000Z"), pickupTime: "16:00" };
  assert.equal(customerCancellationAllowed(booking, now), true);
  assert.deepEqual(customerCancellationData(now), { status: "CANCELLED_BY_CUSTOMER", cancelledAt: now, cancellationSource: "CUSTOMER_SELF_SERVICE" });
});

test("rejects expired and previously used one-time tokens", () => {
  const now = new Date("2026-08-04T10:00:00.000Z");
  assert.equal(cancellationTokenState({ expiresAt: new Date("2026-08-04T09:59:00.000Z"), bookingAllowed: true }, now), "expired");
  assert.equal(cancellationTokenState({ expiresAt: new Date("2026-08-04T11:00:00.000Z"), usedAt: new Date("2026-08-04T09:00:00.000Z"), bookingAllowed: true }, now), "used");
});

test("blocks repeat cancellation and bookings closed by status, completion or pickup time", () => {
  const now = new Date("2026-08-04T13:00:00.000Z");
  assert.equal(cancellationTokenState({ expiresAt: new Date("2026-08-04T14:00:00.000Z"), usedAt: now, bookingAllowed: false }, now), "used");
  assert.equal(customerCancellationAllowed({ status: "CANCELLED_BY_CUSTOMER", startDate: new Date("2026-08-06T00:00:00.000Z"), pickupTime: "12:00" }, now), false);
  assert.equal(customerCancellationAllowed({ status: "CONFIRMED", returnedAt: now, startDate: new Date("2026-08-06T00:00:00.000Z"), pickupTime: "12:00" }, now), false);
  assert.equal(customerCancellationAllowed({ status: "CONFIRMED", startDate: new Date("2026-08-04T00:00:00.000Z"), pickupTime: "16:00" }, now), false);
});

test("rate-limits repeated cancellation-link requests by IP and by booking code", () => {
  assert.equal(cancellationRequestRateLimited(4, 2), false);
  assert.equal(cancellationRequestRateLimited(5, 0), true);
  assert.equal(cancellationRequestRateLimited(0, 3), true);
});
