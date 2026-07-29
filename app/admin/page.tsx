"use client";
import { useState } from "react";

const bookings = [
  { id: "GRC-1042", customer: "Nino Beridze", car: "Toyota RAV4", dates: "02–06 Aug", status: "Pending", price: "$352" },
  { id: "GRC-1041", customer: "Omar Hassan", car: "Land Rover Defender", dates: "30 Jul–03 Aug", status: "Confirmed", price: "$580" },
  { id: "GRC-1040", customer: "Alex Morgan", car: "Mercedes-Benz Vito", dates: "28–31 Jul", status: "Rejected", price: "$480" },
];
export default function AdminPage() {
  const [role, setRole] = useState<"FULL"|"LIMITED">("FULL");
  const [section, setSection] = useState("Dashboard");
  const fullOnly = ["Cars", "Categories", "Promo codes", "Discount settings", "Contact & social", "Admin accounts"];
  const nav = ["Dashboard", "Bookings", ...fullOnly];
  return <main className="admin-shell">
    <aside>
      <a className="brand admin-brand" href="/"><span className="brand-mark"><i/><i/><i/><i/></span><span>GEO<span>RENTAL</span><small>ADMIN CONSOLE</small></span></a>
      <nav>{nav.filter(item => role === "FULL" || !fullOnly.includes(item)).map(item => <button className={section === item ? "active" : ""} key={item} onClick={() => setSection(item)}><span>{({Dashboard:"⌂",Bookings:"▤",Cars:"◇",Categories:"◫","Promo codes":"%", "Discount settings":"⌁","Contact & social":"☎","Admin accounts":"♙"} as Record<string,string>)[item]}</span>{item}</button>)}</nav>
      <a className="back-site" href="/">← View public website</a>
    </aside>
    <section className="admin-main">
      <header><div><small>ADMIN PANEL</small><h1>{section}</h1></div><label>Preview role <select value={role} onChange={(e) => setRole(e.target.value as "FULL"|"LIMITED")}><option>FULL</option><option>LIMITED</option></select></label></header>
      {section === "Dashboard" && <><div className="stat-grid"><article><span>Bookings this month</span><strong>42</strong><small>↑ 12% from last month</small></article><article><span>Pending</span><strong>7</strong><small>Needs attention</small></article><article><span>Confirmed</span><strong>31</strong><small>74% conversion</small></article><article><span>Available cars</span><strong>12</strong><small>of 16 vehicles</small></article></div><BookingsTable limited={role==="LIMITED"} /></>}
      {section === "Bookings" && <BookingsTable limited={role==="LIMITED"} />}
      {section === "Cars" && <Panel title="Fleet management" button="+ Add car"><div className="admin-cards">{["Land Rover Defender","Toyota RAV4","Mercedes-Benz Vito"].map((x,i)=><article key={x}><div className="fake-photo">{["SUV","CROSSOVER","VAN"][i]}</div><h3>{x}</h3><p>${[145,88,120][i]} / day · Available</p><button>Edit vehicle</button></article>)}</div></Panel>}
      {section === "Categories" && <Panel title="Car categories" button="+ New category"><SettingRows items={["SUV — 6 cars","Crossover — 5 cars","Van — 3 cars","Economy — 2 cars"]}/></Panel>}
      {section === "Promo codes" && <Panel title="Promo codes & usage" button="Export Excel"><SettingRows items={["GEORGIA10 · Geo Travel Co. · 18 uses","SUMMER8 · Mountain Guide LLC · 9 uses","WELCOME5 · Direct clients · 6 uses"]}/></Panel>}
      {section === "Discount settings" && <Panel title="Rental duration discount"><div className="settings-form"><label>Starting day<input value="6" readOnly/></label><label>Starting discount<input value="6%" readOnly/></label><label>Daily increase<input value="1%" readOnly/></label><label>Maximum discount<input value="30%" readOnly/></label><button className="button">Save settings</button></div></Panel>}
      {section === "Contact & social" && <Panel title="Contact & social management"><div className="settings-form"><label>Office address<input value="ალექსანდრე ქართველიშვილის 8, Tbilisi" readOnly/></label><label>Phone<input value="+995 555 123 456" readOnly/></label><label>WhatsApp<input value="+995 555 123 456" readOnly/></label><label>Instagram (inactive)<input placeholder="https://instagram.com/..." /></label><button className="button">Save contact details</button></div></Panel>}
      {section === "Admin accounts" && <Panel title="Administrator accounts"><SettingRows items={["admin@georentalcars.com · FULL","operations@georentalcars.com · LIMITED"]}/></Panel>}
    </section>
  </main>;
}
function Panel({title,button,children}:{title:string;button?:string;children:React.ReactNode}){return <section className="admin-panel"><div className="panel-head"><h2>{title}</h2>{button&&<button className="button compact">{button}</button>}</div>{children}</section>}
function SettingRows({items}:{items:string[]}){return <div className="setting-rows">{items.map(x=><div key={x}><span>{x}</span><button>Edit</button></div>)}</div>}
function BookingsTable({limited}:{limited:boolean}){return <section className="admin-panel"><div className="panel-head"><div><small>LIVE OPERATIONS</small><h2>Recent bookings</h2></div><button>View all →</button></div><div className="table-wrap"><table><thead><tr><th>Booking</th><th>Customer</th><th>Car</th><th>Dates</th>{!limited&&<th>Total</th>}<th>Status</th><th>Action</th></tr></thead><tbody>{bookings.map(row=><tr key={row.id}><td><b>{row.id}</b></td><td>{row.customer}</td><td>{row.car}</td><td>{row.dates}</td>{!limited&&<td>{row.price}</td>}<td><span className={`status ${row.status.toLowerCase()}`}>{row.status}</span></td><td><button className="dots">•••</button></td></tr>)}</tbody></table></div></section>}
