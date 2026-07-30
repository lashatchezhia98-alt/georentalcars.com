import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  heroEyebrow: z.string().trim().min(1).max(120),
  heroTitle: z.string().trim().min(1).max(120),
  heroAccent: z.string().trim().min(1).max(120),
  heroCopy: z.string().trim().min(1).max(600),
  fleetEyebrow: z.string().trim().min(1).max(120),
  fleetTitle: z.string().trim().min(1).max(120),
  fleetCopy: z.string().trim().min(1).max(600),
  contactEyebrow: z.string().trim().min(1).max(120),
  contactTitle: z.string().trim().min(1).max(120),
  contactCopy: z.string().trim().min(1).max(600),
  footerTagline: z.string().trim().min(1).max(120),
});
const localizedSchema = z.object({
  en: schema,
  ka: schema,
  ru: schema,
  ar: schema,
});

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = localizedSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  const settings = await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: { localizedContent: parsed.data, ...parsed.data.en },
    create: { id: "default", heroImageUrl: "/hero-wrangler-climb.png", localizedContent: parsed.data, ...parsed.data.en },
  });
  return NextResponse.json(settings);
}
