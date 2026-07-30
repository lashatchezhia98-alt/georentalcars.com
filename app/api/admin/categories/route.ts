import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ categories: z.array(z.object({ id: z.string().min(1), name: z.string().trim().min(2).max(80) })).max(40) });

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid categories" }, { status: 400 });
  for (const category of parsed.data.categories) {
    await prisma.carCategory.upsert({ where: { id: category.id }, update: { name: category.name }, create: category });
  }
  return NextResponse.json({ ok: true });
}
