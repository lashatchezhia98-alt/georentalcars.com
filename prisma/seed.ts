import { PrismaClient, AdminRole } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
const mapsUrl = "https://www.google.com/maps/place/41%C2%B041'45.1%22N+44%C2%B056'53.0%22E/@41.695847,44.9454881,17z/data=!3m1!4b1!4m4!3m3!8m2!3d41.695847!4d44.948063";
async function main() {
  await prisma.discountSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default", startDay: 6, basePercent: 6, incrementPerDay: 1, maxPercent: 30 } });
  await prisma.contactSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default", address: "ალექსანდრე ქართველიშვილის 8, Tbilisi", googleMapsUrl: mapsUrl } });
  const fullPassword = process.env.SEED_FULL_ADMIN_PASSWORD;
  const limitedPassword = process.env.SEED_LIMITED_ADMIN_PASSWORD;
  if (fullPassword && limitedPassword) {
    await Promise.all([
      prisma.adminUser.upsert({ where: { email: "admin@georentalcars.com" }, update: {}, create: { email: "admin@georentalcars.com", passwordHash: await bcrypt.hash(fullPassword, 12), role: AdminRole.FULL } }),
      prisma.adminUser.upsert({ where: { email: "operations@georentalcars.com" }, update: {}, create: { email: "operations@georentalcars.com", passwordHash: await bcrypt.hash(limitedPassword, 12), role: AdminRole.LIMITED } }),
    ]);
  }
}
main().finally(() => prisma.$disconnect());
