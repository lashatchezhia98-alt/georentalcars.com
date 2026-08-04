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
  engine: string; seats: number; fuel: string; transmission: string; image: string; photos?: string[];
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
  aboutEyebrow: string; aboutTitle: string; aboutCopy: string;
  contactEyebrow: string; contactTitle: string; contactCopy: string; footerTagline: string;
};
type LocalizedPublicContent = Record<Locale,PublicContent>;
type DiscountSettings = { startDay:number;basePercent:number;incrementPerDay:number;maxPercent:number };

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
  ka: { birthDate: "დაბადების თარიღი", pickupTime: "აყვანის დრო — საქართველოს დრო", returnTime: "დაბრუნების დრო — საქართველოს დრო", flightNumber: "ფრენის ნომერი — ნებაყოფლობითი", passportNumber: "პასპორტის ნომერი — ნებაყოფლობითი", driverLicenseNumber: "მართვის მოწმობის ნომერი — ნებაყოფლობითი", driverLicenseExpiry: "მართვის მოწმობის ვადა — ნებაყოფლობითი", promoCode: "პრომო კოდი — ნებაყოფლობითი", returnLocation: "დაბრუნების ადგილი", chooseCar: "აირჩიეთ ავტომობილი" },
  en: { birthDate: "Date of birth", pickupTime: "Pickup time — Georgia time", returnTime: "Return time — Georgia time", flightNumber: "Flight number — optional", passportNumber: "Passport number — optional", driverLicenseNumber: "Driver’s license number — optional", driverLicenseExpiry: "Driver’s license expiry date — optional", promoCode: "Promo code — optional", returnLocation: "Return location", chooseCar: "Choose a car" },
  ru: { birthDate: "Дата рождения", pickupTime: "Время получения — по Грузии", returnTime: "Время возврата — по Грузии", flightNumber: "Номер рейса — необязательно", passportNumber: "Номер паспорта — необязательно", driverLicenseNumber: "Номер водительских прав — необязательно", driverLicenseExpiry: "Срок действия водительских прав — необязательно", promoCode: "Промокод — необязательно", returnLocation: "Место возврата", chooseCar: "Выберите автомобиль" },
  ar: { birthDate: "تاريخ الميلاد", pickupTime: "وقت الاستلام — بتوقيت جورجيا", returnTime: "وقت الإرجاع — بتوقيت جورجيا", flightNumber: "رقم الرحلة — اختياري", passportNumber: "رقم جواز السفر — اختياري", driverLicenseNumber: "رقم رخصة القيادة — اختياري", driverLicenseExpiry: "تاريخ انتهاء رخصة القيادة — اختياري", promoCode: "الرمز الترويجي — اختياري", returnLocation: "موقع الإرجاع", chooseCar: "اختر سيارة" },
};
const galleryLabels = {
  ka: { view: "დათვალიერება", details: "ავტომობილის დეტალები", previous: "წინა ფოტო", next: "შემდეგი ფოტო", book: "დაჯავშნა" },
  en: { view: "View details", details: "Vehicle details", previous: "Previous photo", next: "Next photo", book: "Book this car" },
  ru: { view: "Подробнее", details: "Автомобиль", previous: "Предыдущее фото", next: "Следующее фото", book: "Забронировать" },
  ar: { view: "عرض التفاصيل", details: "تفاصيل السيارة", previous: "الصورة السابقة", next: "الصورة التالية", book: "احجز السيارة" },
};
const sendingLabels = { ka: "იგზავნება…", en: "Sending…", ru: "Отправляется…", ar: "جارٍ الإرسال…" };
const promoLabels = {
  ka: { checking: "მოწმდება…", valid: "პრომო კოდი გააქტიურდა", invalid: "პრომო კოდი არასწორია ან არააქტიურია" },
  en: { checking: "Checking…", valid: "Promo code applied", invalid: "Promo code is invalid or inactive" },
  ru: { checking: "Проверка…", valid: "Промокод применён", invalid: "Промокод недействителен или неактивен" },
  ar: { checking: "جارٍ التحقق…", valid: "تم تطبيق الرمز الترويجي", invalid: "الرمز الترويجي غير صالح أو غير نشط" },
};
const summaryLabels = {
  ka: { rentalDiscount: "ხანგრძლივობის ფასდაკლება", promoDiscount: "პრომო-კოდის ფასდაკლება", pickupFee: "მიწოდების საფასური", returnFee: "დაბრუნების საფასური", free: "უფასო" },
  en: { rentalDiscount: "Rental duration discount", promoDiscount: "Promo code discount", pickupFee: "Pickup fee", returnFee: "Return fee", free: "Free" },
  ru: { rentalDiscount: "Скидка за срок аренды", promoDiscount: "Скидка по промокоду", pickupFee: "Стоимость подачи", returnFee: "Стоимость возврата", free: "Бесплатно" },
  ar: { rentalDiscount: "خصم مدة الإيجار", promoDiscount: "خصم الرمز الترويجي", pickupFee: "رسوم الاستلام", returnFee: "رسوم الإرجاع", free: "مجاني" },
};

function dateDays(start: string, end: string) {
  if (!start || !end) return 0;
  return Math.max(0, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);
}
function durationDiscount(days: number, rule: DiscountSettings) {
  if (days < rule.startDay) return 0;
  const discountDay = Math.min(days, 30);
  return Math.min(rule.maxPercent, rule.basePercent + (discountDay - rule.startDay) * rule.incrementPerDay);
}

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
  discountSettings = { startDay:6,basePercent:6,incrementPerDay:1,maxPercent:30 },
}: {
  heroImageUrl?: string;
  pickupLocations?: PickupLocation[];
  cars?: Car[];
  categories?: string[];
  contact?: PublicContact;
  content?: LocalizedPublicContent;
  discountSettings?: DiscountSettings;
}) {
  const [locale, setLocale] = useState<Locale>("en");
  const [menu, setMenu] = useState(false);
  const [category, setCategory] = useState("All");
  const [selectedCar, setSelectedCar] = useState<Car>(cars[0] || fallbackCars[0]);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [promo, setPromo] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoStatus, setPromoStatus] = useState<"idle"|"checking"|"valid"|"invalid">("idle");
  const [pickupId, setPickupId] = useState(pickupLocations[0]?.id || "office-tbilisi");
  const [returnId, setReturnId] = useState(pickupLocations[0]?.id || "office-tbilisi");
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestToken, setRequestToken] = useState("");
  const t = messages[locale];
  const activeContent = content?.[locale];
  const publicCopy = activeContent ? {
    hero: { ...t.hero, eyebrow: activeContent.heroEyebrow, title: activeContent.heroTitle, accent: activeContent.heroAccent, copy: activeContent.heroCopy },
    cars: { ...t.cars, eyebrow: activeContent.fleetEyebrow, title: activeContent.fleetTitle, copy: activeContent.fleetCopy },
    about: { eyebrow: activeContent.aboutEyebrow, title: activeContent.aboutTitle, copy: activeContent.aboutCopy },
    contact: { ...t.contact, eyebrow: activeContent.contactEyebrow, title: activeContent.contactTitle, copy: activeContent.contactCopy },
  } : { ...t, about: { eyebrow: t.how.eyebrow, title: t.nav.about, copy: t.how.copy } };
  const rtl = locale === "ar";
  const visibleCars = category === "All" ? cars : cars.filter((car) => car.category === category);
  const days = dateDays(start, end);
  const discount = durationDiscount(days, discountSettings);
  const selectedPickup = pickupLocations.find((location) => location.id === pickupId) || pickupLocations[0];
  const selectedReturn = pickupLocations.find((location) => location.id === returnId) || pickupLocations[0];
  const pickupFee = selectedPickup?.fee || 0;
  const returnFee = selectedReturn?.fee || 0;
  const subtotal = days * selectedCar.price;
  const durationDiscountAmount = subtotal * discount / 100;
  const afterDurationDiscount = subtotal - durationDiscountAmount;
  const promoDiscountAmount = afterDurationDiscount * promoDiscount / 100;
  const rentalTotal = afterDurationDiscount - promoDiscountAmount;
  const total = rentalTotal + pickupFee + returnFee;
  const pickupName = (location: PickupLocation) => ({ ka: location.nameKa, en: location.nameEn, ru: location.nameRu, ar: location.nameAr })[locale];
  const hasConflict = useMemo(() => Boolean(start && end && end < start), [start, end]);
  const today = new Date().toISOString().slice(0, 10);
  const adultCutoff = new Date(new Date().setFullYear(new Date().getFullYear() - 20)).toISOString().slice(0, 10);
  const showCalendar = (event: React.MouseEvent<HTMLInputElement>) => event.currentTarget.showPicker?.();

  useEffect(() => {
    const savedLocale = window.localStorage.getItem("georentalcars-locale");
    if (savedLocale && ["ka", "en", "ru", "ar"].includes(savedLocale)) setLocale(savedLocale as Locale);
  }, []);

  useEffect(() => {
    const code = promo.trim().toUpperCase();
    setPromoDiscount(0);
    if (!code) { setPromoStatus("idle"); return; }
    setPromoStatus("checking");
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/promo-codes/validate?code=${encodeURIComponent(code)}`, { signal: controller.signal });
        const result = await response.json();
        if (response.ok && result.valid) {
          setPromoDiscount(Number(result.discountPercent) || 0);
          setPromoStatus("valid");
        } else setPromoStatus("invalid");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setPromoStatus("invalid");
      }
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [promo]);

  useEffect(() => {
    document.body.style.overflow = bookingOpen || detailsOpen ? "hidden" : "";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setBookingOpen(false);
        setDetailsOpen(false);
        setMenu(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [bookingOpen, detailsOpen]);

  function beginBooking(car = selectedCar) {
    setSelectedCar(car); setSent(false); setSubmitError(""); setSubmitting(false);
    setRequestToken(window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`);
    setBookingOpen(true);
  }
  function viewCar(car: Car) { setSelectedCar(car); setGalleryIndex(0); setDetailsOpen(true); }
  function changeStartDate(value: string) {
    setStart(value);
    if (end && end < value) setEnd("");
  }
  async function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!days || hasConflict || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/bookings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok) setSent(true);
    else {
      setSubmitError(result.error || "Booking request could not be sent.");
      setSubmitting(false);
    }
  }

  return (
    <main dir={rtl ? "rtl" : "ltr"} className={rtl ? "rtl" : ""}>
      <header className="topbar">
        <a href="#home" className="brand" aria-label="GeoRentalCars home">
          <BrandMark />
          <span className="brand-name">Geo<span>Rental</span>Cars</span>
        </a>
        <nav className={menu ? "nav open" : "nav"} aria-label="Primary navigation">
          <a href="#home" onClick={() => setMenu(false)}>{t.nav.home}</a><a href="#cars" onClick={() => setMenu(false)}>{t.nav.cars}</a><a href="#about" onClick={() => setMenu(false)}>{t.nav.about}</a>
          <a href="#contact" onClick={() => setMenu(false)}>{t.nav.contact}</a>
        </nav>
        <div className="header-actions">
          <label className="language">
            <span className="sr-only">Language</span>
            <select value={locale} onChange={(e) => {
              const nextLocale = e.target.value as Locale;
              setLocale(nextLocale);
              window.localStorage.setItem("georentalcars-locale", nextLocale);
            }}>
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
          <div className="trust"><span>24/7</span></div>
        </div>
        <div className="availability-card">
          <div className="pickup-field"><span>{t.booking.pickup}</span><select aria-label={t.booking.pickup} value={pickupId} onChange={(event) => setPickupId(event.target.value)}>{pickupLocations.map((location) => <option key={location.id} value={location.id}>{pickupName(location)} — {location.fee ? `+$${location.fee}` : locale === "ka" ? "უფასო" : "Free"}</option>)}</select></div>
          <div className="pickup-field"><span>{identityLabels[locale].returnLocation}</span><select aria-label={identityLabels[locale].returnLocation} value={returnId} onChange={(event) => setReturnId(event.target.value)}>{pickupLocations.map((location) => <option key={location.id} value={location.id}>{pickupName(location)} — {location.fee ? `+$${location.fee}` : locale === "ka" ? "უფასო" : "Free"}</option>)}</select></div>
          <div><span>{t.booking.start}</span><input aria-label={t.booking.start} type="date" min={today} value={start} onClick={showCalendar} onChange={(e) => changeStartDate(e.target.value)} /></div>
          <div><span>{t.booking.end}</span><input aria-label={t.booking.end} type="date" min={start || today} value={end} onClick={showCalendar} onChange={(e) => setEnd(e.target.value)} /></div>
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
              <button className="car-image car-image-button" onClick={() => viewCar(car)} aria-label={`${galleryLabels[locale].view}: ${car.name}`}><img src={car.image} alt={car.name} /><span className="available">● {t.cars.available}</span>{index === 0 && <span className="popular">{t.cars.popular}</span>}</button>
              <div className="car-body">
                <div className="car-title"><div><small>{car.category}</small><h3>{car.name}</h3></div></div>
                <div className="specs"><span>⚙ {car.transmission}</span><span>◉ {car.fuel}</span><span>♙ {car.seats} {t.cars.seats}</span></div>
                <button className="view-details" onClick={() => viewCar(car)}>{galleryLabels[locale].view}</button>
                <div className="price"><div><strong>${car.price}</strong><span> / {t.cars.day}</span></div><button onClick={() => beginBooking(car)}>{t.cars.book} ↗</button></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="about" className="about-section section">
        <div className="about-copy">
          <span className="eyebrow">{publicCopy.about.eyebrow}</span>
          <h2>{publicCopy.about.title}</h2>
          <p>{publicCopy.about.copy}</p>
        </div>
        <div className="about-road" aria-hidden="true"><span>GEORGIA</span></div>
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

      <footer><a className="brand" href="#home"><BrandMark /><span className="brand-name">Geo<span>Rental</span>Cars</span></a><p>© 2026 GeoRentalCars.com</p><span>{activeContent?.footerTagline || "Made for Georgia"}</span></footer>

      {detailsOpen && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setDetailsOpen(false)}>
        <section className="car-details-modal" role="dialog" aria-modal="true" aria-labelledby="car-details-title">
          <button className="close" onClick={() => setDetailsOpen(false)} aria-label="Close">×</button>
          <div className="gallery-main">
            <img src={(selectedCar.photos?.length ? selectedCar.photos : [selectedCar.image])[galleryIndex]} alt={`${selectedCar.name} — ${galleryIndex + 1}`} />
            {(selectedCar.photos?.length || 1) > 1 && <>
              <button className="gallery-arrow previous" aria-label={galleryLabels[locale].previous} onClick={() => setGalleryIndex(index => (index - 1 + (selectedCar.photos?.length || 1)) % (selectedCar.photos?.length || 1))}>‹</button>
              <button className="gallery-arrow next" aria-label={galleryLabels[locale].next} onClick={() => setGalleryIndex(index => (index + 1) % (selectedCar.photos?.length || 1))}>›</button>
            </>}
          </div>
          <div className="gallery-thumbnails">
            {(selectedCar.photos?.length ? selectedCar.photos : [selectedCar.image]).map((photo,index)=><button key={`${photo}-${index}`} className={galleryIndex===index?"active":""} onClick={()=>setGalleryIndex(index)}><img src={photo} alt={`${selectedCar.name} ${index+1}`}/></button>)}
          </div>
          <div className="car-detail-copy">
            <span className="eyebrow">{galleryLabels[locale].details}</span><h2 id="car-details-title">{selectedCar.name}</h2>
            <p>{selectedCar.category}</p>
            <div className="specs"><span>⚙ {selectedCar.transmission}</span><span>◉ {selectedCar.fuel}</span><span>♙ {selectedCar.seats} {t.cars.seats}</span><span>{selectedCar.engine}</span></div>
            <div className="detail-action"><strong>${selectedCar.price} <small>/ {t.cars.day}</small></strong><button className="button" onClick={()=>{setDetailsOpen(false);beginBooking(selectedCar)}}>{galleryLabels[locale].book} ↗</button></div>
          </div>
        </section>
      </div>}

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
              <label>{identityLabels[locale].birthDate}<input required name="birthDate" type="date" max={adultCutoff} onClick={showCalendar} /></label>
              <label>{identityLabels[locale].flightNumber}<input name="flightNumber" autoComplete="off" /></label>
              <label>{identityLabels[locale].passportNumber}<input name="passportNumber" autoComplete="off" /></label>
              <label>{identityLabels[locale].driverLicenseNumber}<input name="driverLicenseNumber" autoComplete="off" /></label>
              <label>{identityLabels[locale].driverLicenseExpiry}<input name="driverLicenseExpiry" type="date" min={end || today} onClick={showCalendar} /></label>
              <label>{t.booking.start}<input required name="startDate" type="date" min={today} value={start} onClick={showCalendar} onChange={(e) => changeStartDate(e.target.value)} /></label>
              <label>{t.booking.end}<input required name="endDate" type="date" min={start || today} value={end} onClick={showCalendar} onChange={(e) => setEnd(e.target.value)} /></label>
              <label>{identityLabels[locale].pickupTime}<input required name="pickupTime" type="time" /></label>
              <label>{identityLabels[locale].returnTime}<input required name="returnTime" type="time" /></label>
              <label>{t.booking.pickup}<select required name="pickupLocation" value={pickupId} onChange={(event) => setPickupId(event.target.value)}>{pickupLocations.map((location) => <option key={location.id} value={location.id}>{pickupName(location)} — {location.fee ? `+$${location.fee}` : locale === "ka" ? "უფასო" : "Free"}</option>)}</select></label>
              <label>{identityLabels[locale].returnLocation}<select required name="returnLocation" value={returnId} onChange={(event) => setReturnId(event.target.value)}>{pickupLocations.map((location) => <option key={location.id} value={location.id}>{pickupName(location)} — {location.fee ? `+$${location.fee}` : locale === "ka" ? "უფასო" : "Free"}</option>)}</select></label>
              <label className="full">{identityLabels[locale].promoCode}<input name="promoCode" value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} autoComplete="off" />{promoStatus!=="idle"&&<small className={`promo-feedback ${promoStatus}`}>{promoLabels[locale][promoStatus]}</small>}</label>
            </div>
            <input type="hidden" name="requestToken" value={requestToken} /><input type="hidden" name="carId" value={selectedCar.id} /><input type="hidden" name="language" value={locale} />
            {hasConflict && <p className="error">{t.booking.conflict}</p>}
            {submitError && <p className="error">{submitError}</p>}
            <div className="summary">
              <div><span>{days || "—"} {t.booking.days}</span><span>${subtotal.toFixed(2)}</span></div>
              <div><span>{summaryLabels[locale].rentalDiscount} ({discount}%)</span><span>−${durationDiscountAmount.toFixed(2)}</span></div>
              {promoStatus==="valid"&&<div className="promo-summary"><span>{summaryLabels[locale].promoDiscount} — {promo.trim().toUpperCase()} ({promoDiscount}%)</span><span>−${promoDiscountAmount.toFixed(2)}</span></div>}
              <div><span>{summaryLabels[locale].pickupFee}</span><span>{pickupFee ? `+$${pickupFee.toFixed(2)}` : summaryLabels[locale].free}</span></div>
              <div><span>{summaryLabels[locale].returnFee}</span><span>{returnFee ? `+$${returnFee.toFixed(2)}` : summaryLabels[locale].free}</span></div>
              <div className="total"><strong>{t.booking.total}</strong><strong>${total.toFixed(2)}</strong></div>
            </div>
            <button className="button full-button" disabled={!days || hasConflict || submitting || promoStatus==="checking" || promoStatus==="invalid"}>{submitting?sendingLabels[locale]:`${t.booking.submit} ↗`}</button>
          </form>}
        </section>
      </div>}
    </main>
  );
}
