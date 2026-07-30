import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/admin/login");
  const [settings, pickupLocations, bookings, bookingStats, availableCars] = await Promise.all([
    prisma.siteSettings ? prisma.siteSettings.findUnique({ where: { id: "default" } }).catch(() => null) : null,
    prisma.pickupLocation ? prisma.pickupLocation.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []) : [],
    prisma.booking.findMany({ include: { car: true }, orderBy: { createdAt: "desc" }, take: 100 }).catch(() => []),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }).catch(() => []),
    prisma.car.count({ where: { isAvailable: true } }).catch(() => 0),
  ]);
  const stats = Object.fromEntries(bookingStats.map((row) => [row.status, row._count._all]));
  return <AdminDashboard
    email={session.user.email}
    coverUrl={settings?.heroImageUrl || "/hero-wrangler-climb.png"}
    pickupLocations={pickupLocations.map((location) => ({ id: location.id, name: location.nameKa, fee: Number(location.fee), isActive: location.isActive }))}
    bookings={bookings.map((booking) => ({
      id: booking.id,
      customer: booking.customerName,
      car: booking.car.name,
      dates: `${booking.startDate.toISOString().slice(0, 10)} — ${booking.endDate.toISOString().slice(0, 10)}`,
      status: booking.status,
      price: `$${Number(booking.totalPrice).toFixed(2)}`,
    }))}
    stats={{ total: bookings.length, pending: stats.PENDING || 0, confirmed: stats.CONFIRMED || 0, rejected: stats.REJECTED || 0, availableCars }}
  />;
}
