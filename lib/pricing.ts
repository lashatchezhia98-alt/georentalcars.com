export type DiscountRule = { startDay: number; basePercent: number; incrementPerDay: number; maxPercent: number };
export const defaultDiscount: DiscountRule = { startDay: 6, basePercent: 6, incrementPerDay: 1, maxPercent: 30 };
export function rentalDays(start: Date, end: Date) {
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1);
}
export function durationDiscount(days: number, rule = defaultDiscount) {
  if (days < rule.startDay) return 0;
  return Math.min(rule.maxPercent, rule.basePercent + (days - rule.startDay) * rule.incrementPerDay);
}
export function calculatePrice(days: number, dailyPrice: number, durationPercent: number, promoPercent = 0) {
  const subtotal = days * dailyPrice;
  return Math.round(subtotal * (1 - durationPercent / 100) * (1 - promoPercent / 100) * 100) / 100;
}
