import assert from "node:assert/strict";
import test from "node:test";
import { bookingSchema } from "../lib/validation.ts";

const validBooking = {
  requestToken: "8c6c956d-2684-4e84-9fa8-9cd6ced76d3d",
  firstName: "Test",
  lastName: "Customer",
  phone: "+995555123456",
  email: "customer@example.com",
  birthDate: "1990-01-01",
  carId: "test-car",
  language: "en",
  startDate: "2026-09-10",
  endDate: "2026-09-12",
  pickupTime: "10:00",
  returnTime: "10:00",
  pickupLocation: "office-tbilisi",
  returnLocation: "office-tbilisi",
};

test("accepts a booking without a driver's license expiry date", () => {
  const parsed = bookingSchema.safeParse(validBooking);
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal("driverLicenseExpiry" in parsed.data, false);
});

test("keeps optional identity and promo fields optional", () => {
  assert.equal(bookingSchema.safeParse(validBooking).success, true);
});

test("rejects invalid email, phone, time and missing required dates", () => {
  const parsed = bookingSchema.safeParse({
    ...validBooking,
    email: "invalid",
    phone: "12",
    pickupTime: "27:10",
    endDate: undefined,
  });
  assert.equal(parsed.success, false);
});
