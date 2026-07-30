import RentalExperience from "@/components/RentalExperience";
import { prisma } from "@/lib/prisma";
import en from "@/messages/en.json";
import ka from "@/messages/ka.json";
import ru from "@/messages/ru.json";
import ar from "@/messages/ar.json";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, pickupLocations, cars, categories, contactSettings] = await Promise.all([
    prisma.siteSettings ? prisma.siteSettings.findUnique({ where: { id: "default" } }).catch(() => null) : null,
    prisma.pickupLocation
      ? prisma.pickupLocation.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }).catch(() => [])
      : [],
    prisma.car.findMany({
      where: { isAvailable: true },
      include: { category: true, photos: { orderBy: { sortOrder: "asc" }, take: 6 } },
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
  const defaultContent = {
    en: { heroEyebrow:settings?.heroEyebrow||en.hero.eyebrow,heroTitle:settings?.heroTitle||en.hero.title,heroAccent:settings?.heroAccent||en.hero.accent,heroCopy:settings?.heroCopy||en.hero.copy,fleetEyebrow:settings?.fleetEyebrow||en.cars.eyebrow,fleetTitle:settings?.fleetTitle||en.cars.title,fleetCopy:settings?.fleetCopy||en.cars.copy,contactEyebrow:settings?.contactEyebrow||en.contact.eyebrow,contactTitle:settings?.contactTitle||en.contact.title,contactCopy:settings?.contactCopy||en.contact.copy,footerTagline:settings?.footerTagline||"Made for Georgia" },
    ka: { heroEyebrow:ka.hero.eyebrow,heroTitle:ka.hero.title,heroAccent:ka.hero.accent,heroCopy:ka.hero.copy,fleetEyebrow:ka.cars.eyebrow,fleetTitle:ka.cars.title,fleetCopy:ka.cars.copy,contactEyebrow:ka.contact.eyebrow,contactTitle:ka.contact.title,contactCopy:ka.contact.copy,footerTagline:"შექმნილია საქართველოსთვის" },
    ru: { heroEyebrow:ru.hero.eyebrow,heroTitle:ru.hero.title,heroAccent:ru.hero.accent,heroCopy:ru.hero.copy,fleetEyebrow:ru.cars.eyebrow,fleetTitle:ru.cars.title,fleetCopy:ru.cars.copy,contactEyebrow:ru.contact.eyebrow,contactTitle:ru.contact.title,contactCopy:ru.contact.copy,footerTagline:"Создано для Грузии" },
    ar: { heroEyebrow:ar.hero.eyebrow,heroTitle:ar.hero.title,heroAccent:ar.hero.accent,heroCopy:ar.hero.copy,fleetEyebrow:ar.cars.eyebrow,fleetTitle:ar.cars.title,fleetCopy:ar.cars.copy,contactEyebrow:ar.contact.eyebrow,contactTitle:ar.contact.title,contactCopy:ar.contact.copy,footerTagline:"صُنع من أجل جورجيا" },
  };
  const localizedContent = settings?.localizedContent && typeof settings.localizedContent === "object"
    ? settings.localizedContent as typeof defaultContent
    : defaultContent;
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
      photos: car.photos.map((photo) => photo.secureUrl),
    }))}
    categories={["All", ...categories.map((category) => category.name)]}
    contact={{
      address: contactSettings?.address || "ალექსანდრე ქართველიშვილის 8, Tbilisi",
      googleMapsUrl: contactSettings?.googleMapsUrl || "https://www.google.com/maps",
      phone,
      whatsapp,
    }}
    content={localizedContent}
  />;
}
