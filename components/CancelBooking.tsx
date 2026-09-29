"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import en from "@/messages/en.json";
import ka from "@/messages/ka.json";
import ru from "@/messages/ru.json";
import ar from "@/messages/ar.json";

type Locale = "en"|"ka"|"ru"|"ar";
type BookingSummary = { bookingCode:string;car:string;startDate:string;endDate:string;pickupTime:string;returnTime:string;pickupLocation:string;returnLocation:string;status:string;cancellationFee:number };
const messages={en,ka,ru,ar} as const;

export default function CancelBooking(){
  const [locale,setLocale]=useState<Locale>("en");
  const [code,setCode]=useState("");
  const [requested,setRequested]=useState(false);
  const [sending,setSending]=useState(false);
  const [token,setToken]=useState("");
  const [checking,setChecking]=useState(false);
  const [state,setState]=useState<"request"|"valid"|"invalid"|"expired"|"used"|"closed"|"cancelled">("request");
  const [booking,setBooking]=useState<BookingSummary|null>(null);
  const [cancelling,setCancelling]=useState(false);
  const t=messages[locale];const copy=t.cancelBooking;const rtl=locale==="ar";

  useEffect(()=>{
    const timer=window.setTimeout(()=>{
      const saved=window.localStorage.getItem("georentalcars-locale");
      if(saved&&["en","ka","ru","ar"].includes(saved))setLocale(saved as Locale);
      const fragment=new URLSearchParams(window.location.hash.slice(1));
      const value=fragment.get("token")||"";
      if(value)setToken(value);
    },0);
    return()=>window.clearTimeout(timer);
  },[]);

  useEffect(()=>{
    if(!token)return;
    const controller=new AbortController();
    fetch("/api/bookings/cancellation/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,language:locale}),signal:controller.signal})
      .then(async response=>({response,data:await response.json().catch(()=>({state:"invalid"}))}))
      .then(({response,data})=>{if(response.ok&&data.booking){setBooking(data.booking);setState("valid");}else setState(data.state||"invalid");})
      .catch(error=>{if(error.name!=="AbortError")setState("invalid");})
      .finally(()=>setChecking(false));
    return()=>controller.abort();
  },[token,locale]);

  const changeLocale=(next:Locale)=>{setLocale(next);window.localStorage.setItem("georentalcars-locale",next)};
  const requestLink=async(event:React.FormEvent)=>{
    event.preventDefault();if(sending)return;setSending(true);
    await fetch("/api/bookings/cancellation/request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({bookingCode:code.trim().toUpperCase()})}).catch(()=>undefined);
    setRequested(true);setSending(false);
  };
  const confirmCancellation=async()=>{
    if(cancelling||!token)return;setCancelling(true);
    const response=await fetch("/api/bookings/cancellation/confirm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})});
    const data=await response.json().catch(()=>({state:"invalid"}));
    setState(response.ok?"cancelled":data.state||"invalid");setCancelling(false);
    if(response.ok)window.history.replaceState(null,"","/cancel-booking");
  };
  const errorText=state==="expired"?copy.expiredLink:state==="used"?copy.usedLink:state==="closed"?copy.closed:copy.invalidLink;
  const statusText=booking?.status==="CONFIRMED"?copy.statusConfirmed:copy.statusPending;

  return <main className="cancel-page" dir={rtl?"rtl":"ltr"}>
    <header className="cancel-header"><Link className="brand" href="/"><BrandMark/><span className="brand-name">Geo<span>Rental</span>Cars</span></Link><label className="language"><span className="sr-only">Language</span><select value={locale} onChange={event=>changeLocale(event.target.value as Locale)}><option value="en">EN</option><option value="ka">KA</option><option value="ru">RU</option><option value="ar">AR</option></select></label></header>
    <section className="cancel-shell">
      <div className="cancel-card">
        <span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1>
        {!token&&state==="request"&&<>{requested?<div className="cancel-generic" role="status">✓<p>{copy.generic}</p><p><strong>{copy.genericInstruction}</strong></p></div>:<><p className="cancel-intro">{copy.intro}</p><form className="cancel-request" onSubmit={requestLink}><label>{copy.codeLabel}<input required pattern="GRC-[A-Z0-9]{6,12}" placeholder={copy.codePlaceholder} value={code} onChange={event=>setCode(event.target.value.toUpperCase())}/></label><button className="button" disabled={sending}>{sending?copy.sending:copy.sendLink}</button></form></>}
        </>}
        {token&&checking&&<p className="cancel-loading">{copy.loading}</p>}
        {token&&!checking&&["invalid","expired","used","closed"].includes(state)&&<div className="cancel-error" role="alert"><p>{errorText}</p><Link href="/cancel-booking">{copy.title}</Link></div>}
        {state==="valid"&&booking&&<><div className="cancel-details">
          <div><span>{copy.bookingCode}</span><strong>{booking.bookingCode}</strong></div><div><span>{copy.car}</span><strong>{booking.car}</strong></div>
          <div><span>{copy.dates}</span><strong>{booking.startDate} {booking.pickupTime} — {booking.endDate} {booking.returnTime}</strong></div>
          <div><span>{copy.locations}</span><strong>{booking.pickupLocation} — {booking.returnLocation}</strong></div><div><span>{copy.status}</span><strong>{statusText}</strong></div>
        </div><div className="cancel-policy"><strong>{copy.policyTitle}</strong><p>{copy.policyFree}</p><p>{copy.changeInstruction}</p></div><button className="button cancel-confirm" disabled={cancelling} onClick={confirmCancellation}>{cancelling?copy.cancelling:copy.confirm}</button></>}
        {state==="cancelled"&&<div className="cancel-success"><span>✓</span><h2>{copy.successTitle}</h2><p>{copy.successCopy}</p><Link className="button" href="/">{copy.backHome}</Link></div>}
      </div>
    </section>
  </main>;
}
