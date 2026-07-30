import { z } from "zod";
export const bookingSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,22}$/),
  email: z.email(),
  birthDate: z.iso.date(),
  passportNumber: z.string().trim().min(4).max(30).regex(/^[A-Za-z0-9 -]+$/),
  driverLicenseNumber: z.string().trim().min(4).max(40).regex(/^[A-Za-z0-9 -]+$/),
  driverLicenseExpiry: z.iso.date(),
  carId: z.string().min(1),
  language: z.enum(["ka", "en", "ru", "ar"]),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  pickupLocation: z.string().trim().min(1).max(80),
  promoCode: z.string().trim().max(30).optional(),
});
export const contactNumberSchema = z.object({
  type: z.enum(["PHONE", "WHATSAPP"]),
  number: z.string().trim().regex(/^\+?[0-9 ()-]{7,22}$/),
  label: z.string().trim().max(50).optional(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0),
});
