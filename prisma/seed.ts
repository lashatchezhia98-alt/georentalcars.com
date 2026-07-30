import { PrismaClient, AdminRole } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
const mapsUrl = "https://www.google.com/maps/place/41%C2%B041'45.1%22N+44%C2%B056'53.0%22E/@41.695847,44.9454881,17z/data=!3m1!4b1!4m4!3m3!8m2!3d41.695847!4d44.948063";
async function main() {
  await prisma.discountSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default", startDay: 6, basePercent: 6, incrementPerDay: 1, maxPercent: 30 } });
  const contact = await prisma.contactSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default", address: "ალექსანდრე ქართველიშვილის 8, Tbilisi", googleMapsUrl: mapsUrl } });
  await prisma.contactNumber.deleteMany({ where: { contactSettingsId: contact.id, type: { in: ["PHONE", "WHATSAPP"] } } });
  await prisma.contactNumber.createMany({ data: [
    { contactSettingsId: contact.id, type: "PHONE", number: "+995592710606", label: "Main", isActive: true, sortOrder: 0 },
    { contactSettingsId: contact.id, type: "WHATSAPP", number: "+995592710606", label: "WhatsApp", isActive: true, sortOrder: 0 },
  ] });

  const categoryNames = [
    "Economy",
    "Compact",
    "Standard / Mid-size",
    "Full-size",
    "SUV / Crossover",
    "Large SUV / 4x4",
    "Minivan / 7-seater",
    "Premium / Luxury",
    "Electric / Hybrid",
    "Jeep Wrangler",
  ];
  const categories = await Promise.all(
    categoryNames.map((name) =>
      prisma.carCategory.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );
  const categoryIds = Object.fromEntries(categories.map((category) => [category.name, category.id]));
  const cars = [
    {
      id: "defender",
      name: "Land Rover Defender",
      categoryId: categoryIds["Large SUV / 4x4"],
      description: "Premium adventure-ready SUV for Georgia's mountain roads.",
      dailyPrice: 145,
      engineSpecification: "2.0L Turbo",
      seatCount: 5,
      fuelType: "PETROL" as const,
      transmission: "AUTOMATIC" as const,
      image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=85",
    },
    {
      id: "rav4",
      name: "Toyota RAV4",
      categoryId: categoryIds["SUV / Crossover"],
      description: "Comfortable and efficient crossover for city and regional travel.",
      dailyPrice: 88,
      engineSpecification: "2.5L Hybrid",
      seatCount: 5,
      fuelType: "PETROL" as const,
      transmission: "AUTOMATIC" as const,
      image: "https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&w=1200&q=85",
    },
    {
      id: "viano",
      name: "Mercedes-Benz Vito",
      categoryId: categoryIds["Minivan / 7-seater"],
      description: "Spacious passenger van for families and groups.",
      dailyPrice: 120,
      engineSpecification: "2.0L Diesel",
      seatCount: 8,
      fuelType: "DIESEL" as const,
      transmission: "AUTOMATIC" as const,
      image: "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1200&q=85",
    },
  ];
  for (const { image, ...car } of cars) {
    await prisma.car.upsert({ where: { id: car.id }, update: car, create: car });
    await prisma.carPhoto.upsert({
      where: { carId_sortOrder: { carId: car.id, sortOrder: 0 } },
      update: { secureUrl: image },
      create: { carId: car.id, cloudinaryPublicId: `seed/${car.id}`, secureUrl: image, sortOrder: 0 },
    });
  }
  await prisma.carCategory.deleteMany({
    where: { name: { notIn: categoryNames }, cars: { none: {} } },
  });

  await prisma.promoCode.upsert({
    where: { code: "GEORGIA10" },
    update: { companyName: "Direct clients", discountPercent: 10, isActive: true },
    create: { code: "GEORGIA10", companyName: "Direct clients", discountPercent: 10, isActive: true },
  });
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", heroImageUrl: "/hero-wrangler-climb.png" },
  });
  const pickupLocations = [
    { id: "office-tbilisi", nameKa: "თბილისის ოფისი — ქართველიშვილის 8", nameEn: "Tbilisi Office — 8 Kartvelishvili St.", nameRu: "Офис в Тбилиси — ул. Картвелишвили, 8", nameAr: "مكتب تبليسي — شارع كارتفيليشفيلي 8", fee: 0, sortOrder: 0 },
    { id: "tbilisi-airport", nameKa: "თბილისის საერთაშორისო აეროპორტი", nameEn: "Tbilisi International Airport", nameRu: "Международный аэропорт Тбилиси", nameAr: "مطار تبليسي الدولي", fee: 0, sortOrder: 1 },
    { id: "tbilisi-anywhere", nameKa: "თბილისის ნებისმიერი მისამართი", nameEn: "Anywhere in Tbilisi", nameRu: "Любой адрес в Тбилиси", nameAr: "أي عنوان في تبليسي", fee: 20, sortOrder: 2 },
    { id: "kutaisi-airport", nameKa: "ქუთაისის საერთაშორისო აეროპორტი", nameEn: "Kutaisi International Airport", nameRu: "Международный аэропорт Кутаиси", nameAr: "مطار كوتايسي الدولي", fee: 90, sortOrder: 3 },
    { id: "batumi-airport", nameKa: "ბათუმის საერთაშორისო აეროპორტი", nameEn: "Batumi International Airport", nameRu: "Международный аэропорт Батуми", nameAr: "مطار باتومي الدولي", fee: 120, sortOrder: 4 },
  ];
  for (const location of pickupLocations) {
    await prisma.pickupLocation.upsert({ where: { id: location.id }, update: {}, create: location });
  }

  const ownerEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const ownerPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  if (ownerEmail && ownerPasswordHash) {
    await prisma.adminUser.upsert({
      where: { email: ownerEmail },
      update: { passwordHash: ownerPasswordHash, role: AdminRole.FULL },
      create: { email: ownerEmail, passwordHash: ownerPasswordHash, role: AdminRole.FULL },
    });
  }

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
