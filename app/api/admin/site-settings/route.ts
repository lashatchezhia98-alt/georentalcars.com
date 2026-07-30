import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { v2 as cloudinary } from "cloudinary";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("cover");
  if (!(file instanceof File)) return NextResponse.json({ error: "Image is required" }, { status: 400 });
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG and WebP images are supported" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be smaller than 10 MB" }, { status: 400 });
  }

  const previous = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  const bytes = Buffer.from(await file.arrayBuffer());
  const uploaded = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "georentalcars/site", resource_type: "image", overwrite: true },
      (error, result) => error || !result ? reject(error || new Error("Upload failed")) : resolve(result),
    );
    stream.end(bytes);
  });

  const settings = await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: { heroImageUrl: uploaded.secure_url, heroCloudinaryPublicId: uploaded.public_id },
    create: { id: "default", heroImageUrl: uploaded.secure_url, heroCloudinaryPublicId: uploaded.public_id },
  });
  if (previous?.heroCloudinaryPublicId && previous.heroCloudinaryPublicId !== uploaded.public_id) {
    await cloudinary.uploader.destroy(previous.heroCloudinaryPublicId).catch(() => undefined);
  }
  return NextResponse.json({ heroImageUrl: settings.heroImageUrl });
}
