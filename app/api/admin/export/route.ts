import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const usages = await prisma.promoUsage.findMany({
    include: { promoCode: true, booking: { select: { customerName: true } } },
    orderBy: { usedAt: "desc" },
  });
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Promo usage");
  sheet.columns = [{ header: "Promo code", key: "code", width: 18 }, { header: "Company", key: "company", width: 28 }, { header: "Customer", key: "customer", width: 25 }, { header: "Used at", key: "usedAt", width: 22 }];
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6B4EFF" } };
  sheet.addRows(usages.map((usage) => ({
    code: usage.promoCode.code,
    company: usage.promoCode.companyName,
    customer: usage.booking.customerName,
    usedAt: usage.usedAt.toISOString(),
  })));
  const bytes = await workbook.xlsx.writeBuffer();
  return new NextResponse(bytes as BodyInit, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": "attachment; filename=promo-usage.xlsx" } });
}
