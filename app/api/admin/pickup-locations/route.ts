import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  locations: z.array(z.object({
    id: z.string().min(1).max(80),
    nameKa: z.string().trim().min(2).max(160),
    nameEn: z.string().trim().min(2).max(160),
    nameRu: z.string().trim().min(2).max(160),
    nameAr: z.string().trim().min(2).max(160),
    fee: z.number().min(0).max(10000),
    isActive: z.boolean(),
  })).max(30),
});

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid pickup location settings" }, { status: 400 });
  await prisma.$transaction(parsed.data.locations.map((location) => prisma.pickupLocation.update({
    where: { id: location.id },
    data: {
      nameKa: location.nameKa, nameEn: location.nameEn, nameRu: location.nameRu, nameAr: location.nameAr,
      fee: location.fee, isActive: location.isActive,
    },
  })));
  return NextResponse.json({ ok: true });
}
