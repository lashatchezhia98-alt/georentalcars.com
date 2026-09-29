import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const contactNumber = z.string().trim().max(30).refine(
  (value) => value.replace(/\D/g, "").length >= 7,
  "ნომერი უნდა შეიცავდეს მინიმუმ 7 ციფრს.",
);

const schema = z.object({
  address: z.string().trim().min(3, "ოფისის მისამართი აუცილებელია.").max(240),
  googleMapsUrl: z.union([z.url("Google Maps-ის ბმული არასწორია."), z.literal("")]).optional(),
  phone: contactNumber,
  whatsapp: z.union([contactNumber, z.literal("")]).optional(),
});

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    const error = Object.values(fields).flat()[0] || "საკონტაქტო ინფორმაცია არასწორია.";
    return NextResponse.json({ error, fields }, { status: 400 });
  }
  const whatsapp = parsed.data.whatsapp || parsed.data.phone;
  const googleMapsUrl = parsed.data.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parsed.data.address)}`;
  await prisma.$transaction(async (tx) => {
    const contact = await tx.contactSettings.upsert({
      where: { id: "default" },
      update: { address: parsed.data.address, googleMapsUrl },
      create: { id: "default", address: parsed.data.address, googleMapsUrl },
    });
    await tx.contactNumber.deleteMany({ where: { contactSettingsId: contact.id, type: { in: ["PHONE", "WHATSAPP"] } } });
    await tx.contactNumber.createMany({ data: [
      { contactSettingsId: contact.id, type: "PHONE", number: parsed.data.phone, isActive: true, sortOrder: 0 },
      { contactSettingsId: contact.id, type: "WHATSAPP", number: whatsapp, isActive: true, sortOrder: 0 },
    ] });
  });
  return NextResponse.json({ ok: true, contact: { ...parsed.data, googleMapsUrl, whatsapp } });
}
