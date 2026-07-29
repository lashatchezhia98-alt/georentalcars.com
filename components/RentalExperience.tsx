"use client";

import { useMemo, useState } from "react";
import ka from "@/messages/ka.json";
import en from "@/messages/en.json";
import ru from "@/messages/ru.json";
import ar from "@/messages/ar.json";

type Locale = "ka" | "en" | "ru" | "ar";
type Car = {
  id: string; name: string; category: string; price: number; rating: number;
  engine: string; seats: number; fuel: string; transmission: string; image: string;
};

const messages = { ka, en, ru, ar } as const;
const cars: Car[] = [
  { id: "defender", name: "Land Rover Defender", category: "SUV", price: 145, rating: 4.9, engine: "2.0L Turbo", seats: 5, fuel: "Petrol", transmission: "Automatic", image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=85" },
  { id: "rav4", name: "Toyota RAV4", category: "Crossover", price: 88, rating: 4.8, engine: "2.5L Hybrid", seats: 5, fuel: "Petrol", transmission: "Automatic", image: "https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&w=1200&q=85" },
  { id: "viano", name: "Mercedes-Benz Vito", category: "Van", price: 120, rating: 4.9, engine: "2.0L Diesel", seats: 8, fuel: "Diesel", transmission: "Automatic", image: "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1200&q=85" },
];
const blockedDates = ["2026-08-02", "2026-08-03", "2026-08-11"];

function dateDays(start: string, end: string) {
  if (!start || !end) return 0;
  return Math.max(0, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);
}
function durationDiscount(days: number) { return days < 6 ? 0 : Math.min(30, days); }

export default function RentalExperience() {
  const [locale, setLocale] = useState<Locale>("ka");
  const [menu, setMenu] = useState(false);
  const [category, setCategory] = useState("All");
  const [selectedCar, setSelectedCar] = useState<Car>(cars[0]);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [promo, setPromo] = useState("");
  const [sent, setSent] = useState(false);
  const t = messages[locale];
  const rtl = locale === "ar";
  const visibleCars = category === "All" ? cars : cars.filter((car) => car.category === category);
  const days = dateDays(start, end);
  const discount = durationDiscount(days);
  const promoDiscount = promo.trim().toUpperCase() === "GEORGIA10" ? 10 : 0;
  const subtotal = days * selectedCar.price;
  const total = subtotal * (1 - discount / 100) * (1 - promoDiscount / 100);
  const hasConflict = useMemo(() => {
    if (!start || !end) return false;
    return blockedDates.some((date) => date >= start && date <= end);
  }, [start, end]);

  function beginBooking(car = selectedCar) { setSelectedCar(car); setSent(false); setBookingOpen(true); }
  async function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!days || hasConflict) return;
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/bookings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    if (response.ok) setSent(true);
  }

  return (
    <main dir={rtl ? "rtl" : "ltr"} className={rtl ? "rtl" : ""}>
      <header className="topbar">
        <a href="#home" className="brand" aria-label="GeoRentalCars home">
          <span className="brand-mark"><i /><i /><i /><i /></span>
          <span>GEO<span>RENTAL</span><small>CARS.COM</small></span>
        </a>
        <nav className={menu ? "nav open" : "nav"} aria-label="Primary navigation">
          <a href="#home">{t.nav.home}</a><a href="#cars">{t.nav.cars}</a>
          <a href="#about">{t.nav.about}</a><a href="#contact">{t.nav.contact}</a>
        </nav>
        <div className="header-actions">
          <label className="language">
            <span className="sr-only">Language</span>
            <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
              <option value="ka">KA</option><option value="en">EN</option>
              <option value="ru">RU</option><option value="ar">AR</option>
            </select>
          </label>
          <button className="button compact" onClick={() => beginBooking()}>{t.nav.book}</button>
          <button className="menu-button" aria-label="Toggle menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>☰</button>
        </div>
      </header>

      <section id="home" className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <span className="eyebrow">{t.hero.eyebrow}</span>
          <h1>{t.hero.title}<em>{t.hero.accent}</em></h1>
          <p>{t.hero.copy}</p>
          <div className="hero-actions">
            <button className="button" onClick={() => beginBooking()}>{t.hero.cta} <span>↗</span></button>
            <a className="text-link" href="#cars">{t.hero.secondary} <span>↓</span></a>
          </div>
          <div className="trust"><span>★ 4.9 <small>{t.hero.rating}</small></span><span>24/7 <small>{t.hero.support}</small></span><span>0₾ <small>{t.hero.hidden}</small></span></div>
        </div>
        <div className="availability-card">
          <div><span>{t.booking.pickup}</span><strong>Tbilisi — Office</strong></div>
          <div><span>{t.booking.start}</span><input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div><span>{t.booking.end}</span><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          <button className="button" onClick={() => document.querySelector("#cars")?.scrollIntoView()}>{t.booking.search}</button>
        </div>
      </section>

      <section id="cars" className="section cars-section">
        <div className="section-heading">
          <div><span className="eyebrow">{t.cars.eyebrow}</span><h2>{t.cars.title}</h2></div>
          <p>{t.cars.copy}</p>
        </div>
        <div className="filters">
          {["All", "SUV", "Crossover", "Van"].map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item === "All" ? t.cars.all : item}</button>)}
        </div>
        <div className="car-grid">
          {visibleCars.map((car, index) => (
            <article className="car-card" key={car.id}>
              <div className="car-image"><img src={car.image} alt={car.name} /><span className="available">● {t.cars.available}</span>{index === 0 && <span className="popular">{t.cars.popular}</span>}</div>
              <div className="car-body">
                <div className="car-title"><div><small>{car.category}</small><h3>{car.name}</h3></div><span>★ {car.rating}</span></div>
                <div className="specs"><span>⚙ {car.transmission}</span><span>◉ {car.fuel}</span><span>♙ {car.seats} {t.cars.seats}</span></div>
                <div className="price"><div><strong>${car.price}</strong><span> / {t.cars.day}</span></div><button onClick={() => beginBooking(car)}>{t.cars.book} ↗</button></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="about" className="how section">
        <div className="how-copy"><span className="eyebrow">{t.how.eyebrow}</span><h2>{t.how.title}</h2><p>{t.how.copy}</p><a className="text-link light" href="#contact">{t.how.learn} →</a></div>
        <div className="steps">{t.how.steps.map((step, i) => <article key={step.title}><b>0{i + 1}</b><span>{["⌕", "▣", "⌁"][i]}</span><h3>{step.title}</h3><p>{step.copy}</p></article>)}</div>
      </section>

      <section id="contact" className="contact section">
        <div>
          <span className="eyebrow">{t.contact.eyebrow}</span><h2>{t.contact.title}</h2><p>{t.contact.copy}</p>
          <div className="contact-list">
            <a href="https://www.google.com/maps/place/41%C2%B041'45.1%22N+44%C2%B056'53.0%22E/@41.695847,44.9454881,17z" target="_blank" rel="noreferrer"><b>⌖</b><span><small>{t.contact.office}</small>ალექსანდრე ქართველიშვილის 8, Tbilisi</span></a>
            <a href="tel:+995555123456"><b>☎</b><span><small>{t.contact.call}</small>+995 555 123 456</span></a>
            <a href="https://wa.me/995555123456" target="_blank" rel="noreferrer"><b>◉</b><span><small>WhatsApp</small>+995 555 123 456</span></a>
          </div>
        </div>
        <div className="map-card"><div className="map-lines" /><span className="pin">⌖</span><div className="map-label"><strong>GeoRentalCars</strong><small>8 A. Kartvelishvili St.</small></div></div>
      </section>

      <footer><a className="brand" href="#home"><span className="brand-mark"><i/><i/><i/><i/></span><span>GEO<span>RENTAL</span></span></a><p>© 2026 GeoRentalCars.com</p><a href="/admin">{t.footer.admin}</a></footer>

      {bookingOpen && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setBookingOpen(false)}>
        <section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title">
          <button className="close" onClick={() => setBookingOpen(false)} aria-label="Close">×</button>
          {sent ? <div className="success"><span>✓</span><h2>{t.booking.success}</h2><p>{t.booking.successCopy}</p><button className="button" onClick={() => setBookingOpen(false)}>{t.booking.done}</button></div> :
          <form onSubmit={submitBooking}>
            <span className="eyebrow">{t.booking.eyebrow}</span><h2 id="booking-title">{t.booking.title}</h2>
            <div className="selected-car"><img src={selectedCar.image} alt="" /><div><small>{selectedCar.category}</small><strong>{selectedCar.name}</strong><span>${selectedCar.price} / {t.cars.day}</span></div></div>
            <div className="form-grid">
              <label>{t.booking.first}<input required name="firstName" /></label><label>{t.booking.last}<input required name="lastName" /></label>
              <label>{t.booking.phone}<input required name="phone" type="tel" /></label><label>{t.booking.email}<input required name="email" type="email" /></label>
              <label>{t.booking.start}<input required name="startDate" type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
              <label>{t.booking.end}<input required name="endDate" type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
              <label className="full">{t.booking.pickup}<select name="pickupLocation"><option>Our Office</option><option>Anywhere in Tbilisi</option><option>Tbilisi International Airport</option><option>Kutaisi International Airport</option><option>Batumi International Airport</option></select></label>
              <label className="full">{t.booking.promo}<input name="promoCode" value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="GEORGIA10" /></label>
            </div>
            <input type="hidden" name="carId" value={selectedCar.id} /><input type="hidden" name="language" value={locale} />
            {hasConflict && <p className="error">{t.booking.conflict}</p>}
            <div className="summary"><div><span>{days || "—"} {t.booking.days}</span><span>${subtotal.toFixed(2)}</span></div><div><span>{t.booking.discount} ({discount + promoDiscount}%)</span><span>−${(subtotal - total).toFixed(2)}</span></div><div className="total"><strong>{t.booking.total}</strong><strong>${total.toFixed(2)}</strong></div></div>
            <button className="button full-button" disabled={!days || hasConflict}>{t.booking.submit} ↗</button>
          </form>}
        </section>
      </div>}
    </main>
  );
}
