import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const photoSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
});
const carSchema = z.object({
  id: z.string().min(1), name: z.string().trim().min(2).max(100), categoryId: z.string().min(1),
  description: z.string().trim().max(600), dailyPrice: z.number().min(0).max(10000),
  engineSpecification: z.string().trim().min(1).max(80), seatCount: z.number().int().min(1).max(30),
  fuelType: z.enum(["PETROL", "DIESEL"]), transmission: z.enum(["AUTOMATIC", "MANUAL"]),
  isAvailable: z.boolean(), photos: z.array(photoSchema).min(1).max(6),
});
const schema = z.object({ cars: z.array(carSchema).max(100) });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const files = form.getAll("photos").filter((file): file is File => file instanceof File);
  if (!files.length || files.length > 6) {
    return NextResponse.json({ error: "აირჩიეთ 1-დან 6-მდე ფოტო." }, { status: 400 });
  }
  for (const file of files) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "დაშვებულია JPG, PNG ან WebP, მაქსიმუმ 10 MB თითო ფოტო." }, { status: 400 });
    }
  }
  const photos = await Promise.all(files.map(async (file) => {
    const bytes = Buffer.from(await file.arrayBuffer());
    const uploaded = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "georentalcars/cars", resource_type: "image" },
        (error, result) => error || !result ? reject(error || new Error("Upload failed")) : resolve(result),
      );
      stream.end(bytes);
    });
    return { url: uploaded.secure_url, publicId: uploaded.public_id };
  }));
  return NextResponse.json({ photos });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "მანქანის მონაცემები არასწორია." }, { status: 400 });
  }
  for (const { photos, ...car } of parsed.data.cars) {
    await prisma.$transaction(async (tx) => {
      await tx.car.upsert({ where: { id: car.id }, update: car, create: car });
      await tx.carPhoto.deleteMany({ where: { carId: car.id } });
      await tx.carPhoto.createMany({
        data: photos.map((photo, sortOrder) => ({
          carId: car.id, cloudinaryPublicId: photo.publicId, secureUrl: photo.url, sortOrder,
        })),
      });
    });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "მანქანის ID არ არის მითითებული." }, { status: 400 });

  const car = await prisma.car.findUnique({
    where: { id },
    include: { photos: true, _count: { select: { bookings: true } } },
  });
  if (!car) return NextResponse.json({ error: "მანქანა ვერ მოიძებნა." }, { status: 404 });
  if (car._count.bookings > 0) {
    return NextResponse.json({
      error: "ამ მანქანაზე უკვე არსებობს ჯავშანი. ისტორიის შესანარჩუნებლად გამორთეთ „ხელმისაწვდომია“ და შეინახეთ.",
    }, { status: 409 });
  }

  await prisma.car.delete({ where: { id } });
  await Promise.all(car.photos
    .filter((photo) => !photo.cloudinaryPublicId.startsWith("seed/") && !photo.cloudinaryPublicId.startsWith("admin/"))
    .map((photo) => cloudinary.uploader.destroy(photo.cloudinaryPublicId).catch(() => undefined)));
  return NextResponse.json({ ok: true });
}
