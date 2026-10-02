import test from "node:test";
import assert from "node:assert/strict";
import { pricingPeriod, pricingDuration, dailyRateFor, emptyCarPricing, rentalDays, calculatePrice } from "../lib/pricing.ts";

test("all seasonal boundaries, including year rollover", () => {
  for (const [date, expected] of Object.entries({ "2026-01-01":"dec-apr", "2026-04-30":"dec-apr", "2026-05-01":"may-jun", "2026-06-30":"may-jun", "2026-07-01":"jul-sep", "2026-09-30":"jul-sep", "2026-10-01":"oct-dec", "2026-12-20":"oct-dec", "2026-12-21":"dec-apr", "2026-12-31":"dec-apr" })) {
    assert.equal(pricingPeriod(date), expected);
    assert.equal(pricingPeriod(new Date(date)), expected);
  }
});
test("every duration boundary", () => {
  const expected = [[1,"1-2"],[2,"1-2"],[3,"3-5"],[5,"3-5"],[6,"6-10"],[10,"6-10"],[11,"11-17"],[17,"11-17"],[18,"18-28"],[28,"18-28"],[29,"29-30"],[30,"29-30"],[31,"31+"],[60,"31+"]] as const;
  for (const [days, tier] of expected) assert.equal(pricingDuration(days), tier);
});
test("October three-day rate, fallback and separately held deposit", () => {
  const pricing = emptyCarPricing();
  pricing.rates["oct-dec"]["3-5"] = 59;
  const days = rentalDays(new Date("2026-10-10"),new Date("2026-10-12"));
  assert.equal(days,3);
  assert.equal(dailyRateFor(pricing,90,"2026-10-10",days),59);
  assert.equal(calculatePrice(days,59,0),177);
  assert.equal(pricing.deposit,400);
  assert.equal(dailyRateFor(pricing,90,"",0),90);
  assert.equal(dailyRateFor(pricing,90,"2026-07-10",3),90);
  assert.equal(rentalDays(new Date("2026-10-12"),new Date("2026-10-10")),0);
});
