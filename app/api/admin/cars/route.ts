import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const carSchema = z.object({
  id: z.string().min(1), name: z.string().trim().min(2).max(100), categoryId: z.string().min(1),
  description: z.string().trim().max(600), dailyPrice: z.number().min(0).max(10000),
  engineSpecification: z.string().trim().min(1).max(80), seatCount: z.number().int().min(1).max(30),
  fuelType: z.enum(["PETROL", "DIESEL"]), transmission: z.enum(["AUTOMATIC", "MANUAL"]),
  isAvailable: z.boolean(), image: z.url(),
});
const schema = z.object({ cars: z.array(carSchema).max(100) });

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid car details" }, { status: 400 });
  for (const { image, ...car } of parsed.data.cars) {
    await prisma.car.upsert({ where: { id: car.id }, update: car, create: car });
    await prisma.carPhoto.upsert({
      where: { carId_sortOrder: { carId: car.id, sortOrder: 0 } },
      update: { secureUrl: image },
      create: { carId: car.id, cloudinaryPublicId: `admin/${car.id}`, secureUrl: image, sortOrder: 0 },
    });
  }
  return NextResponse.json({ ok: true });
}
