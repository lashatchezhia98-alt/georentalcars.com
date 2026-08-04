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
    ["Flight number", data.flightNumber],
    ["Passport number", data.passportNumber],
    ["Driver’s license number", data.driverLicenseNumber],
    ["Driver’s license expiry", data.driverLicenseExpiry],
    ["Car", `${data.carName} — ${data.carCategory}`],
    ["Rental dates", `${data.startDate} — ${data.endDate}`],
    ["Pickup time (Georgia, UTC+4)", data.pickupTime],
    ["Return time (Georgia, UTC+4)", data.returnTime],
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

const statusCopy = {
  ka: {
    CONFIRMED: { subject: "თქვენი ჯავშანი დადასტურებულია", title: "ჯავშანი დადასტურებულია", line: "თქვენი მოთხოვნა დავადასტურეთ. შეკითხვების შემთხვევაში დაგვიკავშირდით პასუხით ან WhatsApp-ზე." },
    REJECTED: { subject: "თქვენი ჯავშნის მოთხოვნის განახლება", title: "ჯავშანი ვერ დადასტურდა", line: "სამწუხაროდ, ამ ეტაპზე თქვენი მოთხოვნის დადასტურება ვერ მოვახერხეთ. დაგვიკავშირდით და ალტერნატიული ავტომობილის ან თარიღების შერჩევაში დაგეხმარებით." },
  },
  en: {
    CONFIRMED: { subject: "Your booking is confirmed", title: "Booking confirmed", line: "Your booking request has been confirmed. Reply to this email or contact us on WhatsApp if you have any questions." },
    REJECTED: { subject: "Update about your booking request", title: "Booking could not be confirmed", line: "Unfortunately, we could not confirm your request at this time. Contact us and we will help you choose another vehicle or date range." },
  },
  ru: {
    CONFIRMED: { subject: "Ваше бронирование подтверждено", title: "Бронирование подтверждено", line: "Ваша заявка подтверждена. Если у вас есть вопросы, ответьте на это письмо или свяжитесь с нами в WhatsApp." },
    REJECTED: { subject: "Обновление по вашей заявке", title: "Бронирование не подтверждено", line: "К сожалению, сейчас мы не смогли подтвердить заявку. Свяжитесь с нами, и мы поможем подобрать другой автомобиль или даты." },
  },
  ar: {
    CONFIRMED: { subject: "تم تأكيد حجزك", title: "تم تأكيد الحجز", line: "تم تأكيد طلب الحجز. يمكنك الرد على هذه الرسالة أو التواصل معنا عبر واتساب لأي استفسار." },
    REJECTED: { subject: "تحديث بشأن طلب الحجز", title: "تعذر تأكيد الحجز", line: "للأسف لم نتمكن من تأكيد طلبك حالياً. تواصل معنا وسنساعدك في اختيار سيارة أو تواريخ بديلة." },
  },
} as const;

export async function sendBookingStatusEmail(data: {
  language: string; status: "CONFIRMED" | "REJECTED"; customerEmail: string; customerName: string;
  carName: string; startDate: string; endDate: string; pickupTime: string; returnTime: string; totalPrice: number;
}) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) throw new Error("Email service is not configured");
  const transport = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } });
  const language = (["ka", "en", "ru", "ar"].includes(data.language) ? data.language : "en") as keyof typeof statusCopy;
  const message = statusCopy[language][data.status];
  const safe = (value: string | number) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character);
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#10172f"><h2>GeoRentalCars.com</h2><h1 style="font-size:26px">${safe(message.title)}</h1><p>${safe(message.line)}</p><table style="border-collapse:collapse;width:100%;margin:22px 0"><tr><td style="padding:9px;border-bottom:1px solid #ddd;font-weight:700">Customer</td><td style="padding:9px;border-bottom:1px solid #ddd">${safe(data.customerName)}</td></tr><tr><td style="padding:9px;border-bottom:1px solid #ddd;font-weight:700">Car</td><td style="padding:9px;border-bottom:1px solid #ddd">${safe(data.carName)}</td></tr><tr><td style="padding:9px;border-bottom:1px solid #ddd;font-weight:700">Dates</td><td style="padding:9px;border-bottom:1px solid #ddd">${safe(data.startDate)} ${safe(data.pickupTime)} — ${safe(data.endDate)} ${safe(data.returnTime)} (Georgia, UTC+4)</td></tr><tr><td style="padding:9px;border-bottom:1px solid #ddd;font-weight:700">Total</td><td style="padding:9px;border-bottom:1px solid #ddd">$${data.totalPrice.toFixed(2)}</td></tr></table></div>`;
  await transport.sendMail({ from: process.env.GMAIL_USER, to: data.customerEmail, subject: message.subject, html });
}
