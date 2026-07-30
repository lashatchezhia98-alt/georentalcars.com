"use client";
import { useState } from "react";
import BrandMark from "@/components/BrandMark";
import { signOut } from "next-auth/react";

type AdminPickupLocation = { id: string; name: string; fee: number; isActive: boolean };
type AdminBooking = { id: string; customer: string; car: string; dates: string; status: string; price: string };
type AdminStats = { total: number; pending: number; confirmed: number; rejected: number; availableCars: number };
export default function AdminDashboard({ email, coverUrl, pickupLocations, bookings: initialBookings, stats }: { email: string; coverUrl: string; pickupLocations: AdminPickupLocation[]; bookings: AdminBooking[]; stats: AdminStats }) {
  const [section, setSection] = useState("Dashboard");
  const [currentCover, setCurrentCover] = useState(coverUrl);
  const [coverMessage, setCoverMessage] = useState("");
  const [locations, setLocations] = useState(pickupLocations);
  const [locationMessage, setLocationMessage] = useState("");
  const [bookings, setBookings] = useState(initialBookings);
  async function updateBooking(id: string, status: "CONFIRMED" | "REJECTED") {
    const response = await fetch(`/api/admin/bookings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (response.ok) setBookings((rows) => rows.map((row) => row.id === id ? { ...row, status } : row));
  }
  const fullOnly = ["Cars", "Categories", "Cover photo", "Pickup locations", "Promo codes", "Discount settings", "Contact & social", "Admin accounts"];
  const nav = ["Dashboard", "Bookings", ...fullOnly];
  return <main className="admin-shell">
    <aside>
      <a className="brand admin-brand" href="/"><BrandMark /><span className="brand-name">Geo<span>Rental</span>Cars</span></a>
      <nav>{nav.map(item => <button className={section === item ? "active" : ""} key={item} onClick={() => setSection(item)}><span>{({Dashboard:"⌂",Bookings:"▤",Cars:"◇",Categories:"◫","Cover photo":"▧","Pickup locations":"⌖","Promo codes":"%", "Discount settings":"⌁","Contact & social":"☎","Admin accounts":"♙"} as Record<string,string>)[item]}</span>{item}</button>)}</nav>
      <a className="back-site" href="/">← View public website</a>
    </aside>
    <section className="admin-main">
      <header><div><small>ADMIN PANEL</small><h1>{section}</h1></div><div className="admin-account"><span>{email}</span><button onClick={() => signOut({ callbackUrl: "/admin/login" })}>Sign out</button></div></header>
      {section === "Dashboard" && <><div className="stat-grid"><article><span>Total bookings</span><strong>{stats.total}</strong><small>All booking requests</small></article><article><span>Pending</span><strong>{stats.pending}</strong><small>Needs attention</small></article><article><span>Confirmed / Rejected</span><strong>{stats.confirmed} / {stats.rejected}</strong><small>Current status totals</small></article><article><span>Available cars</span><strong>{stats.availableCars}</strong><small>Active vehicles</small></article></div><BookingsTable limited={false} bookings={bookings.slice(0, 8)} onStatus={updateBooking} /></>}
      {section === "Bookings" && <BookingsTable limited={false} bookings={bookings} onStatus={updateBooking} />}
      {section === "Cars" && <Panel title="Fleet management" button="+ Add car"><div className="admin-cards">{["Land Rover Defender","Toyota RAV4","Mercedes-Benz Vito"].map((x,i)=><article key={x}><div className="fake-photo">{["SUV","CROSSOVER","VAN"][i]}</div><h3>{x}</h3><p>${[145,88,120][i]} / day · Available</p><button>Edit vehicle</button></article>)}</div></Panel>}
      {section === "Categories" && <Panel title="Car categories" button="+ New category"><SettingRows items={["SUV — 6 cars","Crossover — 5 cars","Van — 3 cars","Economy — 2 cars"]}/></Panel>}
      {section === "Cover photo" && <Panel title="Homepage cover photo"><form className="cover-form" onSubmit={async (event) => {
        event.preventDefault();
        setCoverMessage("Uploading…");
        const response = await fetch("/api/admin/site-settings", { method: "POST", body: new FormData(event.currentTarget) });
        const data = await response.json();
        if (response.ok) { setCurrentCover(data.heroImageUrl); setCoverMessage("Cover photo updated."); }
        else setCoverMessage(data.error || "Upload failed.");
      }}><img src={currentCover} alt="Current homepage cover" /><label>Choose JPG, PNG or WebP (max 10 MB)<input name="cover" type="file" accept="image/jpeg,image/png,image/webp" required /></label><button className="button" type="submit">Upload new cover</button>{coverMessage && <p>{coverMessage}</p>}</form></Panel>}
      {section === "Pickup locations" && <Panel title="Pickup location fees"><form className="location-settings" onSubmit={async (event) => {
        event.preventDefault();
        setLocationMessage("Saving…");
        const response = await fetch("/api/admin/pickup-locations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locations }) });
        setLocationMessage(response.ok ? "Pickup fees saved." : "Could not save pickup fees.");
      }}>{locations.map((location, index) => <div key={location.id}><label className="location-toggle"><input type="checkbox" checked={location.isActive} onChange={(event) => setLocations((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, isActive: event.target.checked } : item))} /><span>{location.name}</span></label><label>დამატებითი თანხა ($)<input type="number" min="0" step="1" value={location.fee} onChange={(event) => setLocations((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, fee: Number(event.target.value) } : item))} /></label></div>)}<button className="button" type="submit">Save pickup fees</button>{locationMessage && <p>{locationMessage}</p>}</form></Panel>}
      {section === "Promo codes" && <Panel title="Promo codes & usage" button="Export Excel"><SettingRows items={["GEORGIA10 · Geo Travel Co. · 18 uses","SUMMER8 · Mountain Guide LLC · 9 uses","WELCOME5 · Direct clients · 6 uses"]}/></Panel>}
      {section === "Discount settings" && <Panel title="Rental duration discount"><div className="settings-form"><label>Starting day<input value="6" readOnly/></label><label>Starting discount<input value="6%" readOnly/></label><label>Daily increase<input value="1%" readOnly/></label><label>Maximum discount<input value="30%" readOnly/></label><button className="button">Save settings</button></div></Panel>}
      {section === "Contact & social" && <Panel title="Contact & social management"><div className="settings-form"><label>Office address<input value="ალექსანდრე ქართველიშვილის 8, Tbilisi" readOnly/></label><label>Phone<input value="+995 592 710 606" readOnly/></label><label>WhatsApp<input value="+995 592 710 606" readOnly/></label><label>Instagram (inactive)<input placeholder="https://instagram.com/..." /></label><button className="button">Save contact details</button></div></Panel>}
      {section === "Admin accounts" && <Panel title="Administrator accounts"><SettingRows items={["admin@georentalcars.com · FULL","operations@georentalcars.com · LIMITED"]}/></Panel>}
    </section>
  </main>;
}
function Panel({title,button,children}:{title:string;button?:string;children:React.ReactNode}){return <section className="admin-panel"><div className="panel-head"><h2>{title}</h2>{button&&<button className="button compact">{button}</button>}</div>{children}</section>}
function SettingRows({items}:{items:string[]}){return <div className="setting-rows">{items.map(x=><div key={x}><span>{x}</span><button>Edit</button></div>)}</div>}
function BookingsTable({limited,bookings,onStatus}:{limited:boolean;bookings:AdminBooking[];onStatus:(id:string,status:"CONFIRMED"|"REJECTED")=>void}){return <section className="admin-panel"><div className="panel-head"><div><small>LIVE OPERATIONS</small><h2>Recent bookings</h2></div></div><div className="table-wrap"><table><thead><tr><th>Booking</th><th>Customer</th><th>Car</th><th>Dates</th>{!limited&&<th>Total</th>}<th>Status</th><th>Action</th></tr></thead><tbody>{bookings.length ? bookings.map(row=><tr key={row.id}><td><b>{row.id.slice(-8).toUpperCase()}</b></td><td>{row.customer}</td><td>{row.car}</td><td>{row.dates}</td>{!limited&&<td>{row.price}</td>}<td><span className={`status ${row.status.toLowerCase()}`}>{row.status}</span></td><td><div className="booking-actions"><button onClick={()=>onStatus(row.id,"CONFIRMED")}>Confirm</button><button onClick={()=>onStatus(row.id,"REJECTED")}>Reject</button></div></td></tr>) : <tr><td colSpan={7}>No bookings yet.</td></tr>}</tbody></table></div></section>}
