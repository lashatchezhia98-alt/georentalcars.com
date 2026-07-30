import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const schema = z.object({
  heroEyebrow: z.string().trim().min(1).max(120),
  heroTitle: z.string().trim().min(1).max(120),
  heroAccent: z.string().trim().min(1).max(120),
  heroCopy: z.string().trim().min(1).max(600),
  fleetEyebrow: z.string().trim().min(1).max(120),
  fleetTitle: z.string().trim().min(1).max(120),
  fleetCopy: z.string().trim().min(1).max(600),
  aboutEyebrow: z.string().trim().min(1).max(120),
  aboutTitle: z.string().trim().min(1).max(120),
  aboutCopy: z.string().trim().min(1).max(1000),
  contactEyebrow: z.string().trim().min(1).max(120),
  contactTitle: z.string().trim().min(1).max(120),
  contactCopy: z.string().trim().min(1).max(600),
  footerTagline: z.string().trim().min(1).max(120),
});
const requestSchema = z.object({ locale: z.enum(["en", "ka", "ru", "ar"]), content: schema });

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid content" }, { status: 400 });
  }
  const previous = await prisma.siteSettings.findUnique({ where: { id: "default" }, select: { localizedContent: true } });
  const current = previous?.localizedContent && typeof previous.localizedContent === "object" && !Array.isArray(previous.localizedContent)
    ? previous.localizedContent as Record<string, Prisma.JsonValue>
    : {};
  const localizedContent = { ...current, [parsed.data.locale]: parsed.data.content } as Prisma.InputJsonObject;
  const legacyEnglish = parsed.data.locale === "en" ? parsed.data.content : {};
  const settings = await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: { localizedContent, ...legacyEnglish },
    create: { id: "default", heroImageUrl: "/hero-wrangler-climb.png", localizedContent, ...legacyEnglish },
  });
  return NextResponse.json({ ok: true, locale: parsed.data.locale, updatedAt: settings.updatedAt });
}
