import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  startDay: z.number().int().min(1).max(30),
  basePercent: z.number().min(0).max(100),
  incrementPerDay: z.number().min(0).max(100),
  maxPercent: z.number().min(0).max(100),
}).refine((value) => value.basePercent <= value.maxPercent, {
  message: "საწყისი ფასდაკლება მაქსიმალურ ფასდაკლებაზე მეტი ვერ იქნება.",
});

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "მონაცემები არასწორია." }, { status: 400 });

  const settings = await prisma.discountSettings.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });
  return NextResponse.json({
    startDay: settings.startDay,
    basePercent: Number(settings.basePercent),
    incrementPerDay: Number(settings.incrementPerDay),
    maxPercent: Number(settings.maxPercent),
  });
}
