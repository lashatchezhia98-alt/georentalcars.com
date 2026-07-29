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
  const summary = `<h2>GeoRentalCars.com</h2><p>${data.carName}</p><p>${data.startDate} — ${data.endDate}</p><p>${data.pickupLocation}</p><p><strong>$${data.totalPrice}</strong></p>`;
  await Promise.all([
    transport.sendMail({ from: process.env.GMAIL_USER, to: process.env.ADMIN_BOOKING_EMAIL || "lashachezhia@gmail.com", subject: `New booking — ${data.customerName}`, html: `${summary}<p>${data.customerPhone} · ${data.customerEmail}</p>` }),
    transport.sendMail({ from: process.env.GMAIL_USER, to: String(data.customerEmail), subject: copy[language].subject, html: `${summary}<p>${copy[language].line}</p>` }),
  ]);
}
