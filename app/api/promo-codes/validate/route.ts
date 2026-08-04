import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim().toUpperCase();
  if (!code) return NextResponse.json({ valid: false, discountPercent: 0 });

  const promo = await prisma.promoCode.findFirst({
    where: { code, isActive: true },
    select: { discountPercent: true },
  });

  return NextResponse.json({
    valid: Boolean(promo),
    discountPercent: promo ? Number(promo.discountPercent) : 0,
  });
}
