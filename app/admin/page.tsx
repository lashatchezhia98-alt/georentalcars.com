import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import en from "@/messages/en.json";
import ka from "@/messages/ka.json";
import ru from "@/messages/ru.json";
import ar from "@/messages/ar.json";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/admin/login");
  const [settings, pickupLocations, bookings, bookingStats, availableCars, cars, categories, contactSettings, promoCodes] = await Promise.all([
    prisma.siteSettings ? prisma.siteSettings.findUnique({ where: { id: "default" } }).catch(() => null) : null,
    prisma.pickupLocation ? prisma.pickupLocation.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []) : [],
    prisma.booking.findMany({ include: { car: true }, orderBy: { createdAt: "desc" }, take: 100 }).catch(() => []),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }).catch(() => []),
    prisma.car.count({ where: { isAvailable: true } }).catch(() => 0),
    prisma.car.findMany({ include: { photos: { orderBy: { sortOrder: "asc" }, take: 6 } }, orderBy: { createdAt: "asc" } }).catch(() => []),
    prisma.carCategory.findMany({ orderBy: { name: "asc" } }).catch(() => []),
    prisma.contactSettings.findUnique({ where: { id: "default" }, include: { numbers: true } }).catch(() => null),
    prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []),
  ]);
  const stats = Object.fromEntries(bookingStats.map((row) => [row.status, row._count._all]));
  const defaultContent = {
    en: {
      heroEyebrow: settings?.heroEyebrow || en.hero.eyebrow, heroTitle: settings?.heroTitle || en.hero.title,
      heroAccent: settings?.heroAccent || en.hero.accent, heroCopy: settings?.heroCopy || en.hero.copy,
      fleetEyebrow: settings?.fleetEyebrow || en.cars.eyebrow, fleetTitle: settings?.fleetTitle || en.cars.title,
      fleetCopy: settings?.fleetCopy || en.cars.copy, contactEyebrow: settings?.contactEyebrow || en.contact.eyebrow,
      contactTitle: settings?.contactTitle || en.contact.title, contactCopy: settings?.contactCopy || en.contact.copy,
      footerTagline: settings?.footerTagline || "Made for Georgia",
    },
    ka: { heroEyebrow:ka.hero.eyebrow,heroTitle:ka.hero.title,heroAccent:ka.hero.accent,heroCopy:ka.hero.copy,fleetEyebrow:ka.cars.eyebrow,fleetTitle:ka.cars.title,fleetCopy:ka.cars.copy,contactEyebrow:ka.contact.eyebrow,contactTitle:ka.contact.title,contactCopy:ka.contact.copy,footerTagline:"შექმნილია საქართველოსთვის" },
    ru: { heroEyebrow:ru.hero.eyebrow,heroTitle:ru.hero.title,heroAccent:ru.hero.accent,heroCopy:ru.hero.copy,fleetEyebrow:ru.cars.eyebrow,fleetTitle:ru.cars.title,fleetCopy:ru.cars.copy,contactEyebrow:ru.contact.eyebrow,contactTitle:ru.contact.title,contactCopy:ru.contact.copy,footerTagline:"Создано для Грузии" },
    ar: { heroEyebrow:ar.hero.eyebrow,heroTitle:ar.hero.title,heroAccent:ar.hero.accent,heroCopy:ar.hero.copy,fleetEyebrow:ar.cars.eyebrow,fleetTitle:ar.cars.title,fleetCopy:ar.cars.copy,contactEyebrow:ar.contact.eyebrow,contactTitle:ar.contact.title,contactCopy:ar.contact.copy,footerTagline:"صُنع من أجل جورجيا" },
  };
  const localizedContent = settings?.localizedContent && typeof settings.localizedContent === "object"
    ? settings.localizedContent as typeof defaultContent
    : defaultContent;
  return <AdminDashboard
    email={session.user.email}
    coverUrl={settings?.heroImageUrl || "/hero-wrangler-climb.png"}
    pickupLocations={pickupLocations.map((location) => ({
      id: location.id, nameKa: location.nameKa, nameEn: location.nameEn, nameRu: location.nameRu, nameAr: location.nameAr,
      fee: Number(location.fee), isActive: location.isActive,
    }))}
    bookings={bookings.map((booking) => ({
      id: booking.id,
      customer: booking.customerName,
      car: booking.car.name,
      dates: `${booking.startDate.toISOString().slice(0, 10)} — ${booking.endDate.toISOString().slice(0, 10)}`,
      status: booking.status,
      price: `$${Number(booking.totalPrice).toFixed(2)}`,
    }))}
    stats={{ total: bookings.length, pending: stats.PENDING || 0, confirmed: stats.CONFIRMED || 0, rejected: stats.REJECTED || 0, availableCars }}
    content={localizedContent}
    cars={cars.map((car) => ({
      id: car.id, name: car.name, categoryId: car.categoryId, description: car.description,
      dailyPrice: Number(car.dailyPrice), engineSpecification: car.engineSpecification, seatCount: car.seatCount,
      fuelType: car.fuelType, transmission: car.transmission, isAvailable: car.isAvailable,
      photos: car.photos.map((photo) => ({ url: photo.secureUrl, publicId: photo.cloudinaryPublicId })),
    }))}
    categories={categories.map((category) => ({ id: category.id, name: category.name }))}
    promoCodes={promoCodes.map((promo) => ({ id: promo.id, code: promo.code, companyName: promo.companyName, discountPercent: Number(promo.discountPercent), isActive: promo.isActive }))}
    contact={{
      address: contactSettings?.address || "",
      googleMapsUrl: contactSettings?.googleMapsUrl || "",
      phone: contactSettings?.numbers.find((number) => number.type === "PHONE")?.number || "",
      whatsapp: contactSettings?.numbers.find((number) => number.type === "WHATSAPP")?.number || "",
    }}
  />;
}
