export type DiscountRule = { startDay: number; basePercent: number; incrementPerDay: number; maxPercent: number };
export const pricingPeriods = [
  { id: "jul-sep", label: "Jul 01 – Sep 30" },
  { id: "oct-dec", label: "Oct 01 – Dec 20" },
  { id: "dec-apr", label: "Dec 21 – Apr 30" },
  { id: "may-jun", label: "May 01 – Jun 30" },
] as const;
export const pricingDurations = ["1-2", "3-5", "6-10", "11-17", "18-28", "29-30", "31+"] as const;
export type PricingPeriod = typeof pricingPeriods[number]["id"];
export type PricingDuration = typeof pricingDurations[number];
export type CarPricing = { deposit: number; rates: Record<PricingPeriod, Record<PricingDuration, number>> };
export function parseCarPricing(value: unknown): CarPricing | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { deposit?: unknown; rates?: unknown };
  if (typeof candidate.deposit !== "number" || !candidate.rates || typeof candidate.rates !== "object") return null;
  const rates = candidate.rates as Record<string, unknown>;
  const parsed = Object.fromEntries(pricingPeriods.map(({ id }) => {
    const period = rates[id];
    if (!period || typeof period !== "object") return [id, Object.fromEntries(pricingDurations.map((duration) => [duration, 0]))];
    const source = period as Record<string, unknown>;
    return [id, Object.fromEntries(pricingDurations.map((duration) => [duration, typeof source[duration] === "number" ? source[duration] : 0]))];
  })) as CarPricing["rates"];
  return { deposit: candidate.deposit, rates: parsed };
}
export const emptyCarPricing = (): CarPricing => ({
  deposit: 400,
  rates: Object.fromEntries(pricingPeriods.map(({ id }) => [id, Object.fromEntries(pricingDurations.map((duration) => [duration, 0]))])) as CarPricing["rates"],
});
export function pricingPeriod(date: Date | string): PricingPeriod {
  const value = typeof date === "string" ? date.slice(5, 10) : `${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  if (value >= "07-01" && value <= "09-30") return "jul-sep";
  if (value >= "10-01" && value <= "12-20") return "oct-dec";
  if (value >= "12-21" || value <= "04-30") return "dec-apr";
  return "may-jun";
}
export function pricingDuration(days: number): PricingDuration {
  if (days <= 2) return "1-2";
  if (days <= 5) return "3-5";
  if (days <= 10) return "6-10";
  if (days <= 17) return "11-17";
  if (days <= 28) return "18-28";
  if (days <= 30) return "29-30";
  return "31+";
}
export function dailyRateFor(pricing: CarPricing | null | undefined, fallback: number, start: Date | string, days: number) {
  if (!start || !days) return fallback;
  const rate = pricing?.rates?.[pricingPeriod(start)]?.[pricingDuration(days)];
  return typeof rate === "number" && rate > 0 ? rate : fallback;
}
export const defaultDiscount: DiscountRule = { startDay: 6, basePercent: 6, incrementPerDay: 1, maxPercent: 30 };
export function rentalDays(start: Date, end: Date) {
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1);
}
export function durationDiscount(days: number, rule = defaultDiscount) {
  if (days < rule.startDay) return 0;
  const discountDay = Math.min(days, 30);
  return Math.min(rule.maxPercent, rule.basePercent + (discountDay - rule.startDay) * rule.incrementPerDay);
}
export function calculatePrice(days: number, dailyPrice: number, durationPercent: number, promoPercent = 0) {
  const subtotal = days * dailyPrice;
  return Math.round(subtotal * (1 - durationPercent / 100) * (1 - promoPercent / 100) * 100) / 100;
}
