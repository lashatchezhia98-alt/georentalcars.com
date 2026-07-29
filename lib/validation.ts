import { z } from "zod";
export const bookingSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,22}$/),
  email: z.email(),
  carId: z.string().min(1),
  language: z.enum(["ka", "en", "ru", "ar"]),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  pickupLocation: z.enum(["Our Office", "Anywhere in Tbilisi", "Tbilisi International Airport", "Kutaisi International Airport", "Batumi International Airport"]),
  promoCode: z.string().trim().max(30).optional(),
});
export const contactNumberSchema = z.object({
  type: z.enum(["PHONE", "WHATSAPP"]),
  number: z.string().trim().regex(/^\+?[0-9 ()-]{7,22}$/),
  label: z.string().trim().max(50).optional(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0),
});
