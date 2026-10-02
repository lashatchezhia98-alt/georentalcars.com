import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";
import { siteCopy } from "../lib/site-copy.ts";

const prisma = new PrismaClient();
try {
  const settings = await prisma.siteSettings.findUniqueOrThrow({ where: { id: "default" } });
  const before = settings.localizedContent;
  const saved = (before && typeof before === "object" && !Array.isArray(before) ? before : {}) as Record<string, Record<string, unknown>>;
  const next = { ...saved };
  const fields = ["heroEyebrow", "heroTitle", "heroAccent", "heroCopy", "fleetEyebrow", "fleetTitle", "fleetCopy", "aboutEyebrow", "aboutTitle", "aboutCopy", "contactEyebrow", "contactTitle", "contactCopy", "footerTagline"] as const;
  for (const locale of ["ka", "en", "ru", "ar"] as const) {
    next[locale] = { ...saved[locale], ...Object.fromEntries(fields.map(key => [key, siteCopy[locale][key]])) };
  }
  if (process.argv.includes("--apply")) {
    const backup = `/private/tmp/georentalcars-copy-${Date.now()}.json`;
    writeFileSync(backup, JSON.stringify({ localizedContent: before }, null, 2), { mode: 0o600, flag: "wx" });
    await prisma.siteSettings.update({ where: { id: "default" }, data: { localizedContent: JSON.parse(JSON.stringify(next)) } });
    console.log(`Updated public copy in four languages. Backup: ${backup}`);
  } else {
    console.log("Dry run: four languages, 14 public content fields each. Pass --apply to save. Other settings are preserved.");
  }
} finally {
  await prisma.$disconnect();
}
