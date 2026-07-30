import RentalExperience from "@/components/RentalExperience";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, pickupLocations, cars, categories, contactSettings] = await Promise.all([
    prisma.siteSettings ? prisma.siteSettings.findUnique({ where: { id: "default" } }).catch(() => null) : null,
    prisma.pickupLocation
      ? prisma.pickupLocation.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }).catch(() => [])
      : [],
    prisma.car.findMany({
      where: { isAvailable: true },
      include: { category: true, photos: { orderBy: { sortOrder: "asc" }, take: 1 } },
      orderBy: { createdAt: "asc" },
    }).catch(() => []),
    prisma.carCategory.findMany({ orderBy: { name: "asc" } }).catch(() => []),
    prisma.contactSettings.findUnique({
      where: { id: "default" },
      include: { numbers: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    }).catch(() => null),
  ]);
  const phone = contactSettings?.numbers.find((number) => number.type === "PHONE")?.number || "+995592710606";
  const whatsapp = contactSettings?.numbers.find((number) => number.type === "WHATSAPP")?.number || phone;
  return <RentalExperience
    heroImageUrl={settings?.heroImageUrl || "/hero-wrangler-climb.png"}
    pickupLocations={pickupLocations.map((location) => ({
      id: location.id,
      nameKa: location.nameKa,
      nameEn: location.nameEn,
      nameRu: location.nameRu,
      nameAr: location.nameAr,
      fee: Number(location.fee),
    }))}
    cars={cars.map((car) => ({
      id: car.id,
      name: car.name,
      category: car.category.name,
      price: Number(car.dailyPrice),
      rating: 0,
      engine: car.engineSpecification,
      seats: car.seatCount,
      fuel: car.fuelType === "PETROL" ? "Petrol" : "Diesel",
      transmission: car.transmission === "AUTOMATIC" ? "Automatic" : "Manual",
      image: car.photos[0]?.secureUrl || "/hero-wrangler-climb.png",
    }))}
    categories={["All", ...categories.map((category) => category.name)]}
    contact={{
      address: contactSettings?.address || "ალექსანდრე ქართველიშვილის 8, Tbilisi",
      googleMapsUrl: contactSettings?.googleMapsUrl || "https://www.google.com/maps",
      phone,
      whatsapp,
    }}
  />;
}
