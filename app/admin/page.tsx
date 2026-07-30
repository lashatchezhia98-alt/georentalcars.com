import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/admin/login");
  const [settings, pickupLocations, bookings, bookingStats, availableCars, cars, categories, contactSettings] = await Promise.all([
    prisma.siteSettings ? prisma.siteSettings.findUnique({ where: { id: "default" } }).catch(() => null) : null,
    prisma.pickupLocation ? prisma.pickupLocation.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []) : [],
    prisma.booking.findMany({ include: { car: true }, orderBy: { createdAt: "desc" }, take: 100 }).catch(() => []),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }).catch(() => []),
    prisma.car.count({ where: { isAvailable: true } }).catch(() => 0),
    prisma.car.findMany({ include: { photos: { orderBy: { sortOrder: "asc" }, take: 6 } }, orderBy: { createdAt: "asc" } }).catch(() => []),
    prisma.carCategory.findMany({ orderBy: { name: "asc" } }).catch(() => []),
    prisma.contactSettings.findUnique({ where: { id: "default" }, include: { numbers: true } }).catch(() => null),
  ]);
  const stats = Object.fromEntries(bookingStats.map((row) => [row.status, row._count._all]));
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
    content={{
      heroEyebrow: settings?.heroEyebrow || "Made for the road ahead",
      heroTitle: settings?.heroTitle || "Georgia,",
      heroAccent: settings?.heroAccent || "your way.",
      heroCopy: settings?.heroCopy || "Adventure-ready cars. Transparent pricing. Local support — wherever the road takes you.",
      fleetEyebrow: settings?.fleetEyebrow || "The right car for every road",
      fleetTitle: settings?.fleetTitle || "Choose your ride",
      fleetCopy: settings?.fleetCopy || "From Tbilisi streets to mountain passes, every vehicle is prepared, inspected, and ready.",
      contactEyebrow: settings?.contactEyebrow || "Local people. Real support.",
      contactTitle: settings?.contactTitle || "Let’s talk",
      contactCopy: settings?.contactCopy || "Questions about a route or vehicle? Our local team is ready to help before, during, and after your trip.",
      footerTagline: settings?.footerTagline || "Made for Georgia",
    }}
    cars={cars.map((car) => ({
      id: car.id, name: car.name, categoryId: car.categoryId, description: car.description,
      dailyPrice: Number(car.dailyPrice), engineSpecification: car.engineSpecification, seatCount: car.seatCount,
      fuelType: car.fuelType, transmission: car.transmission, isAvailable: car.isAvailable,
      photos: car.photos.map((photo) => ({ url: photo.secureUrl, publicId: photo.cloudinaryPublicId })),
    }))}
    categories={categories.map((category) => ({ id: category.id, name: category.name }))}
    contact={{
      address: contactSettings?.address || "",
      googleMapsUrl: contactSettings?.googleMapsUrl || "",
      phone: contactSettings?.numbers.find((number) => number.type === "PHONE")?.number || "",
      whatsapp: contactSettings?.numbers.find((number) => number.type === "WHATSAPP")?.number || "",
    }}
  />;
}
