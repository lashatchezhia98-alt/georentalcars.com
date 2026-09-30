import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ categories: z.array(z.object({ id: z.string().min(1), name: z.string().trim().min(2).max(80) })).max(40) });

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid categories" }, { status: 400 });
  for (const category of parsed.data.categories) {
    await prisma.carCategory.upsert({ where: { id: category.id }, update: { name: category.name }, create: category });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "კატეგორიის ID არ არის მითითებული." }, { status: 400 });

  const category = await prisma.carCategory.findUnique({
    where: { id },
    include: { _count: { select: { cars: true } } },
  });
  if (!category) return NextResponse.json({ error: "კატეგორია ვერ მოიძებნა." }, { status: 404 });
  if (category._count.cars > 0) {
    return NextResponse.json({
      error: `კატეგორიაში არის ${category._count.cars} ავტომობილი. ჯერ გადაიყვანეთ ისინი სხვა კატეგორიაში ან წაშალეთ.`,
    }, { status: 409 });
  }
  await prisma.carCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
