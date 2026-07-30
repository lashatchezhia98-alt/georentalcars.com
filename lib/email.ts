import nodemailer from "nodemailer";

const copy = {
  ka: { subject: "ჯავშნის მოთხოვნა მიღებულია", line: "ჩვენი გუნდი WhatsApp-ით დაგიკავშირდებათ ჯავშნის დასადასტურებლად." },
  en: { subject: "Your booking request was received", line: "Our team will contact you on WhatsApp to confirm your booking." },
  ru: { subject: "Ваша заявка на бронирование получена", line: "Наша команда свяжется с вами в WhatsApp для подтверждения." },
  ar: { subject: "تم استلام طلب الحجز", line: "سيتواصل فريقنا معك عبر واتساب لتأكيد الحجز." },
};
export async function sendBookingEmails(data: Record<string, string | number>) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;
  const transport = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } });
  const language = (data.language as keyof typeof copy) || "ka";
  const safe = (value: string | number) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character);
  const rows: Array<[string, string | number]> = [
    ["Customer", data.customerName],
    ["Phone / WhatsApp", data.customerPhone],
    ["Email", data.customerEmail],
    ["Date of birth", data.birthDate],
    ["Passport number", data.passportNumber],
    ["Driver’s license number", data.driverLicenseNumber],
    ["Driver’s license expiry", data.driverLicenseExpiry],
    ["Car", `${data.carName} — ${data.carCategory}`],
    ["Rental dates", `${data.startDate} — ${data.endDate}`],
    ["Total days", data.totalDays],
    ["Daily price", `$${Number(data.dailyPrice).toFixed(2)}`],
    ["Pickup location", data.pickupLocation],
    ["Pickup fee", `$${Number(data.pickupFee).toFixed(2)}`],
    ["Return location", data.returnLocation],
    ["Return fee", `$${Number(data.returnFee).toFixed(2)}`],
    ["Rental discount", `${data.rentalDiscount}%`],
    ["Promo code", data.promoCode],
    ["Promo discount", `${data.promoDiscount}%`],
    ["Total price", `$${Number(data.totalPrice).toFixed(2)}`],
  ];
  const summary = `<h2>GeoRentalCars.com</h2><table style="border-collapse:collapse;width:100%;max-width:680px">${rows.map(([label, value]) => `<tr><td style="border-bottom:1px solid #ddd;padding:8px;font-weight:600">${safe(label)}</td><td style="border-bottom:1px solid #ddd;padding:8px">${safe(value)}</td></tr>`).join("")}</table>`;
  await Promise.all([
    transport.sendMail({ from: process.env.GMAIL_USER, to: process.env.ADMIN_BOOKING_EMAIL || "lashachezhia@gmail.com", subject: `New booking — ${data.customerName}`, html: `${summary}<p>${data.customerPhone} · ${data.customerEmail}</p>` }),
    transport.sendMail({ from: process.env.GMAIL_USER, to: String(data.customerEmail), subject: copy[language].subject, html: `${summary}<p>${copy[language].line}</p>` }),
  ]);
}
