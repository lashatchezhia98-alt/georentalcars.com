import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const promoSchema = z.object({
  id: z.string().min(1),
  code: z.string().trim().min(2).max(30).transform((value) => value.toUpperCase()),
  companyName: z.string().trim().min(2).max(100),
  discountPercent: z.number().min(0).max(20),
  isActive: z.boolean(),
});

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = z.object({ promoCodes: z.array(promoSchema).max(100) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "პრომო-კოდის მონაცემები არასწორია." }, { status: 400 });
  try {
    await prisma.$transaction(parsed.data.promoCodes.map((promo) =>
      prisma.promoCode.upsert({
        where: { id: promo.id },
        update: promo,
        create: { ...promo, isActive: true },
      }),
    ));
  } catch {
    return NextResponse.json({ error: "პრომო-კოდი უნიკალური უნდა იყოს." }, { status: 409 });
  }
  const promoCodes = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({
    ok: true,
    promoCodes: promoCodes.map((promo) => ({
      id: promo.id,
      code: promo.code,
      companyName: promo.companyName,
      discountPercent: Number(promo.discountPercent),
      isActive: promo.isActive,
    })),
  });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "პრომო-კოდის ID არ არის მითითებული." }, { status: 400 });
  const promo = await prisma.promoCode.findUnique({ where: { id }, include: { _count: { select: { bookings: true } } } });
  if (!promo) return NextResponse.json({ error: "პრომო-კოდი ვერ მოიძებნა." }, { status: 404 });
  if (promo._count.bookings > 0) {
    await prisma.promoCode.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true, archived: true });
  }
  await prisma.promoCode.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
