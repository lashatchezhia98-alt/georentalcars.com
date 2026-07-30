"use client";

import { useEffect, useMemo, useState } from "react";
import BrandMark from "@/components/BrandMark";
import GeorgiaMapMark from "@/components/GeorgiaMapMark";
import ka from "@/messages/ka.json";
import en from "@/messages/en.json";
import ru from "@/messages/ru.json";
import ar from "@/messages/ar.json";

type Locale = "ka" | "en" | "ru" | "ar";
type Car = {
  id: string; name: string; category: string; price: number; rating: number;
  engine: string; seats: number; fuel: string; transmission: string; image: string;
};
type PickupLocation = {
  id: string; nameKa: string; nameEn: string; nameRu: string; nameAr: string; fee: number;
};
type PublicContact = {
  address: string; googleMapsUrl: string; phone: string; whatsapp: string;
};
type PublicContent = {
  heroEyebrow: string; heroTitle: string; heroAccent: string; heroCopy: string;
  fleetEyebrow: string; fleetTitle: string; fleetCopy: string;
  contactEyebrow: string; contactTitle: string; contactCopy: string; footerTagline: string;
};

const messages = { ka, en, ru, ar } as const;
const fallbackCars: Car[] = [
  { id: "defender", name: "Land Rover Defender", category: "Large SUV / 4x4", price: 145, rating: 4.9, engine: "2.0L Turbo", seats: 5, fuel: "Petrol", transmission: "Automatic", image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=85" },
  { id: "rav4", name: "Toyota RAV4", category: "SUV / Crossover", price: 88, rating: 4.8, engine: "2.5L Hybrid", seats: 5, fuel: "Petrol", transmission: "Automatic", image: "https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&w=1200&q=85" },
  { id: "viano", name: "Mercedes-Benz Vito", category: "Minivan / 7-seater", price: 120, rating: 4.9, engine: "2.0L Diesel", seats: 8, fuel: "Diesel", transmission: "Automatic", image: "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1200&q=85" },
];
const fallbackCategories = [
  "All",
  "Economy",
  "Compact",
  "Standard / Mid-size",
  "Full-size",
  "SUV / Crossover",
  "Large SUV / 4x4",
  "Minivan / 7-seater",
  "Premium / Luxury",
  "Electric / Hybrid",
  "Jeep Wrangler",
];
const fallbackPickupLocations: PickupLocation[] = [
  { id: "office-tbilisi", nameKa: "თბილისის ოფისი — ქართველიშვილის 8", nameEn: "Tbilisi Office — 8 Kartvelishvili St.", nameRu: "Офис в Тбилиси", nameAr: "مكتب تبليسي", fee: 0 },
  { id: "tbilisi-airport", nameKa: "თბილისის საერთაშორისო აეროპორტი", nameEn: "Tbilisi International Airport", nameRu: "Аэропорт Тбилиси", nameAr: "مطار تبليسي الدولي", fee: 0 },
  { id: "tbilisi-anywhere", nameKa: "თბილისის ნებისმიერი მისამართი", nameEn: "Anywhere in Tbilisi", nameRu: "Любой адрес в Тбилиси", nameAr: "أي عنوان في تبليسي", fee: 20 },
  { id: "kutaisi-airport", nameKa: "ქუთაისის საერთაშორისო აეროპორტი", nameEn: "Kutaisi International Airport", nameRu: "Аэропорт Кутаиси", nameAr: "مطار كوتايسي الدولي", fee: 90 },
  { id: "batumi-airport", nameKa: "ბათუმის საერთაშორისო აეროპორტი", nameEn: "Batumi International Airport", nameRu: "Аэропорт Батуми", nameAr: "مطار باتومي الدولي", fee: 120 },
];
const identityLabels = {
  ka: { birthDate: "დაბადების თარიღი", passportNumber: "პასპორტის ნომერი", driverLicenseNumber: "მართვის მოწმობის ნომერი", driverLicenseExpiry: "მართვის მოწმობის ვადა", returnLocation: "დაბრუნების ადგილი", chooseCar: "აირჩიეთ ავტომობილი" },
  en: { birthDate: "Date of birth", passportNumber: "Passport number", driverLicenseNumber: "Driver’s license number", driverLicenseExpiry: "Driver’s license expiry date", returnLocation: "Return location", chooseCar: "Choose a car" },
  ru: { birthDate: "Дата рождения", passportNumber: "Номер паспорта", driverLicenseNumber: "Номер водительских прав", driverLicenseExpiry: "Срок действия водительских прав", returnLocation: "Место возврата", chooseCar: "Выберите автомобиль" },
  ar: { birthDate: "تاريخ الميلاد", passportNumber: "رقم جواز السفر", driverLicenseNumber: "رقم رخصة القيادة", driverLicenseExpiry: "تاريخ انتهاء رخصة القيادة", returnLocation: "موقع الإرجاع", chooseCar: "اختر سيارة" },
};

function dateDays(start: string, end: string) {
  if (!start || !end) return 0;
  return Math.max(0, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);
}
function durationDiscount(days: number) { return days < 6 ? 0 : Math.min(30, days); }

export default function RentalExperience({
  heroImageUrl = "/hero-wrangler-climb.png",
  pickupLocations = fallbackPickupLocations,
  cars = fallbackCars,
  categories = fallbackCategories,
  contact = {
    address: "ალექსანდრე ქართველიშვილის 8, Tbilisi",
    googleMapsUrl: "https://www.google.com/maps/place/41%C2%B041'45.1%22N+44%C2%B056'53.0%22E/@41.695847,44.9454881,17z",
    phone: "+995592710606",
    whatsapp: "+995592710606",
  },
  content,
}: {
  heroImageUrl?: string;
  pickupLocations?: PickupLocation[];
  cars?: Car[];
  categories?: string[];
  contact?: PublicContact;
  content?: PublicContent;
}) {
  const [locale, setLocale] = useState<Locale>("en");
  const [menu, setMenu] = useState(false);
  const [category, setCategory] = useState("All");
  const [selectedCar, setSelectedCar] = useState<Car>(cars[0] || fallbackCars[0]);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [promo, setPromo] = useState("");
  const [pickupId, setPickupId] = useState(pickupLocations[0]?.id || "office-tbilisi");
  const [returnId, setReturnId] = useState(pickupLocations[0]?.id || "office-tbilisi");
  const [sent, setSent] = useState(false);
  const t = messages[locale];
  const publicCopy = locale === "en" && content ? {
    hero: { ...t.hero, eyebrow: content.heroEyebrow, title: content.heroTitle, accent: content.heroAccent, copy: content.heroCopy },
    cars: { ...t.cars, eyebrow: content.fleetEyebrow, title: content.fleetTitle, copy: content.fleetCopy },
    contact: { ...t.contact, eyebrow: content.contactEyebrow, title: content.contactTitle, copy: content.contactCopy },
  } : t;
  const rtl = locale === "ar";
  const visibleCars = category === "All" ? cars : cars.filter((car) => car.category === category);
  const days = dateDays(start, end);
  const discount = durationDiscount(days);
  const promoDiscount = promo.trim().toUpperCase() === "GEORGIA10" ? 10 : 0;
  const selectedPickup = pickupLocations.find((location) => location.id === pickupId) || pickupLocations[0];
  const selectedReturn = pickupLocations.find((location) => location.id === returnId) || pickupLocations[0];
  const pickupFee = selectedPickup?.fee || 0;
  const returnFee = selectedReturn?.fee || 0;
  const subtotal = days * selectedCar.price;
  const rentalTotal = subtotal * (1 - discount / 100) * (1 - promoDiscount / 100);
  const total = rentalTotal + pickupFee + returnFee;
  const pickupName = (location: PickupLocation) => ({ ka: location.nameKa, en: location.nameEn, ru: location.nameRu, ar: location.nameAr })[locale];
  const hasConflict = useMemo(() => Boolean(start && end && end < start), [start, end]);
  const today = new Date().toISOString().slice(0, 10);
  const adultCutoff = new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0, 10);

  useEffect(() => {
    document.body.style.overflow = bookingOpen ? "hidden" : "";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setBookingOpen(false);
        setMenu(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [bookingOpen]);

  function beginBooking(car = selectedCar) { setSelectedCar(car); setSent(false); setBookingOpen(true); }
  function changeStartDate(value: string) {
    setStart(value);
    if (end && end < value) setEnd("");
  }
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
          <BrandMark />
          <span className="brand-name">Geo<span>Rental</span>Cars</span>
        </a>
        <nav className={menu ? "nav open" : "nav"} aria-label="Primary navigation">
          <a href="#home" onClick={() => setMenu(false)}>{t.nav.home}</a><a href="#cars" onClick={() => setMenu(false)}>{t.nav.cars}</a>
          <a href="#contact" onClick={() => setMenu(false)}>{t.nav.contact}</a>
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
        <div className="hero-bg" style={{ backgroundImage: `url("${heroImageUrl}")` }} />
        <GeorgiaMapMark />
        <div className="hero-content">
          <span className="eyebrow">{publicCopy.hero.eyebrow}</span>
          <h1>{publicCopy.hero.title}<em>{publicCopy.hero.accent}</em></h1>
          <p>{publicCopy.hero.copy}</p>
          <div className="hero-actions">
            <button className="button" onClick={() => beginBooking()}>{t.hero.cta} <span>↗</span></button>
            <a className="text-link" href="#cars">{t.hero.secondary} <span>↓</span></a>
          </div>
          <div className="trust"><span>24/7 <small>{t.hero.support}</small></span><span>0₾ <small>{t.hero.hidden}</small></span></div>
        </div>
        <div className="availability-card">
          <div className="pickup-field"><span>{t.booking.pickup}</span><select aria-label={t.booking.pickup} value={pickupId} onChange={(event) => setPickupId(event.target.value)}>{pickupLocations.map((location) => <option key={location.id} value={location.id}>{pickupName(location)} — {location.fee ? `+$${location.fee}` : locale === "ka" ? "უფასო" : "Free"}</option>)}</select></div>
          <div className="pickup-field"><span>{identityLabels[locale].returnLocation}</span><select aria-label={identityLabels[locale].returnLocation} value={returnId} onChange={(event) => setReturnId(event.target.value)}>{pickupLocations.map((location) => <option key={location.id} value={location.id}>{pickupName(location)} — {location.fee ? `+$${location.fee}` : locale === "ka" ? "უფასო" : "Free"}</option>)}</select></div>
          <div><span>{t.booking.start}</span><input aria-label={t.booking.start} type="date" min={today} value={start} onChange={(e) => changeStartDate(e.target.value)} /></div>
          <div><span>{t.booking.end}</span><input aria-label={t.booking.end} type="date" min={start || today} value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          <button className="button" onClick={() => document.querySelector("#cars")?.scrollIntoView()}>{t.booking.search}</button>
        </div>
      </section>

      <section id="cars" className="section cars-section">
        <div className="section-heading">
          <div><span className="eyebrow">{publicCopy.cars.eyebrow}</span><h2>{publicCopy.cars.title}</h2></div>
          <p>{publicCopy.cars.copy}</p>
        </div>
        <div className="filters">
          {categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item === "All" ? t.cars.all : item}</button>)}
        </div>
        <div className="car-grid">
          {visibleCars.map((car, index) => (
            <article className="car-card" key={car.id}>
              <div className="car-image"><img src={car.image} alt={car.name} /><span className="available">● {t.cars.available}</span>{index === 0 && <span className="popular">{t.cars.popular}</span>}</div>
              <div className="car-body">
                <div className="car-title"><div><small>{car.category}</small><h3>{car.name}</h3></div></div>
                <div className="specs"><span>⚙ {car.transmission}</span><span>◉ {car.fuel}</span><span>♙ {car.seats} {t.cars.seats}</span></div>
                <div className="price"><div><strong>${car.price}</strong><span> / {t.cars.day}</span></div><button onClick={() => beginBooking(car)}>{t.cars.book} ↗</button></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="contact section">
        <div>
          <span className="eyebrow">{publicCopy.contact.eyebrow}</span><h2>{publicCopy.contact.title}</h2><p>{publicCopy.contact.copy}</p>
          <div className="contact-list">
            <a href={contact.googleMapsUrl} target="_blank" rel="noreferrer"><b>⌖</b><span><small>{t.contact.office}</small>{contact.address}</span></a>
            <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}><b>☎</b><span><small>{t.contact.call}</small>{contact.phone}</span></a>
            <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><b>◉</b><span><small>WhatsApp</small>{contact.whatsapp}</span></a>
          </div>
        </div>
        <a className="map-card" href={contact.googleMapsUrl} target="_blank" rel="noreferrer" aria-label="GeoRentalCars-ის ლოკაციის გახსნა Google Maps-ში">
          <div className="map-lines" /><span className="pin">⌖</span><div className="map-label"><strong>GeoRentalCars</strong><small>8 A. Kartvelishvili St.</small></div>
        </a>
      </section>

      <footer><a className="brand" href="#home"><BrandMark /><span className="brand-name">Geo<span>Rental</span>Cars</span></a><p>© 2026 GeoRentalCars.com</p><span>{content?.footerTagline || "Made for Georgia"}</span></footer>

      {bookingOpen && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setBookingOpen(false)}>
        <section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title">
          <button className="close" onClick={() => setBookingOpen(false)} aria-label="Close">×</button>
          {sent ? <div className="success"><span>✓</span><h2>{t.booking.success}</h2><p>{t.booking.successCopy}</p><button className="button" onClick={() => setBookingOpen(false)}>{t.booking.done}</button></div> :
          <form onSubmit={submitBooking}>
            <span className="eyebrow">{t.booking.eyebrow}</span><h2 id="booking-title">{t.booking.title}</h2>
            <div className="selected-car">
              <img src={selectedCar.image} alt={selectedCar.name} />
              <label>
                <small>{identityLabels[locale].chooseCar}</small>
                <select value={selectedCar.id} onChange={(event) => {
                  const car = cars.find((item) => item.id === event.target.value);
                  if (car) setSelectedCar(car);
                }}>
                  {cars.map((car) => <option key={car.id} value={car.id}>{car.name} — ${car.price} / {t.cars.day}</option>)}
                </select>
                <span>{selectedCar.category}</span>
              </label>
            </div>
            <div className="form-grid">
              <label>{t.booking.first}<input required name="firstName" /></label><label>{t.booking.last}<input required name="lastName" /></label>
              <label>{t.booking.phone}<input required name="phone" type="tel" /></label><label>{t.booking.email}<input required name="email" type="email" /></label>
              <label>{identityLabels[locale].birthDate}<input required name="birthDate" type="date" max={adultCutoff} /></label>
              <label>{identityLabels[locale].passportNumber}<input required name="passportNumber" autoComplete="off" /></label>
              <label>{identityLabels[locale].driverLicenseNumber}<input required name="driverLicenseNumber" autoComplete="off" /></label>
              <label>{identityLabels[locale].driverLicenseExpiry}<input required name="driverLicenseExpiry" type="date" min={end || today} /></label>
              <label>{t.booking.start}<input required name="startDate" type="date" min={today} value={start} onChange={(e) => changeStartDate(e.target.value)} /></label>
              <label>{t.booking.end}<input required name="endDate" type="date" min={start || today} value={end} onChange={(e) => setEnd(e.target.value)} /></label>
              <label>{t.booking.pickup}<select required name="pickupLocation" value={pickupId} onChange={(event) => setPickupId(event.target.value)}>{pickupLocations.map((location) => <option key={location.id} value={location.id}>{pickupName(location)} — {location.fee ? `+$${location.fee}` : locale === "ka" ? "უფასო" : "Free"}</option>)}</select></label>
              <label>{identityLabels[locale].returnLocation}<select required name="returnLocation" value={returnId} onChange={(event) => setReturnId(event.target.value)}>{pickupLocations.map((location) => <option key={location.id} value={location.id}>{pickupName(location)} — {location.fee ? `+$${location.fee}` : locale === "ka" ? "უფასო" : "Free"}</option>)}</select></label>
              <label className="full">{t.booking.promo}<input name="promoCode" value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="GEORGIA10" /></label>
            </div>
            <input type="hidden" name="carId" value={selectedCar.id} /><input type="hidden" name="language" value={locale} />
            {hasConflict && <p className="error">{t.booking.conflict}</p>}
            <div className="summary"><div><span>{days || "—"} {t.booking.days}</span><span>${subtotal.toFixed(2)}</span></div><div><span>{t.booking.discount} ({discount + promoDiscount}%)</span><span>−${(subtotal - rentalTotal).toFixed(2)}</span></div><div><span>{locale === "ka" ? "მიწოდების საფასური" : "Pickup fee"}</span><span>{pickupFee ? `+$${pickupFee.toFixed(2)}` : locale === "ka" ? "უფასო" : "Free"}</span></div><div><span>{locale === "ka" ? "დაბრუნების საფასური" : "Return fee"}</span><span>{returnFee ? `+$${returnFee.toFixed(2)}` : locale === "ka" ? "უფასო" : "Free"}</span></div><div className="total"><strong>{t.booking.total}</strong><strong>${total.toFixed(2)}</strong></div></div>
            <button className="button full-button" disabled={!days || hasConflict}>{t.booking.submit} ↗</button>
          </form>}
        </section>
      </div>}
    </main>
  );
}
