"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import BrandMark from "@/components/BrandMark";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AdminPickupLocation = { id:string;nameKa:string;nameEn:string;nameRu:string;nameAr:string;fee:number;isActive:boolean };
type AdminBooking = {
  id:string;bookingCode:string;customer:string;car:string;dates:string;createdAt:string;status:string;totalPrice:number;cancelledBy:string|null;cancelledAt:string|null;
  promoCode:string|null;promoCompany:string|null;promoPercent:number;promoAmount:number;
  commissionBase:number;grossCommission:number;netCommission:number;companyRevenue:number;fees:number;
};
type AdminStats = { total: number; pending: number; confirmed: number; rejected: number; cancelled:number;availableCars: number };
type AdminContent = { heroEyebrow:string;heroTitle:string;heroAccent:string;heroCopy:string;fleetEyebrow:string;fleetTitle:string;fleetCopy:string;aboutEyebrow:string;aboutTitle:string;aboutCopy:string;contactEyebrow:string;contactTitle:string;contactCopy:string;footerTagline:string };
type ContentLocale = "en"|"ka"|"ru"|"ar";
type LocalizedAdminContent = Record<ContentLocale,AdminContent>;
type AdminCategory = { id:string;name:string };
type AdminPromoCode = { id:string;code:string;companyName:string;discountPercent:number;isActive:boolean };
type AdminCarPhoto = { url:string;publicId:string };
type AdminCar = { id:string;name:string;categoryId:string;description:string;dailyPrice:number;engineSpecification:string;seatCount:number;fuelType:"PETROL"|"DIESEL";transmission:"AUTOMATIC"|"MANUAL";isAvailable:boolean;photos:AdminCarPhoto[] };
type AdminContact = { address:string;googleMapsUrl:string;phone:string;whatsapp:string };
type AdminDiscountSettings = { startDay:number;basePercent:number;incrementPerDay:number;maxPercent:number };

const sections = [
  ["მთავარი","⌂"],["ჯავშნები","▤"],["ბუღალტერია","$"],["ავტომობილები","◇"],["კატეგორიები","◫"],["საიტის ტექსტები","✎"],
  ["პრომო კოდები","%"],["ქოვერის ფოტო","▧"],["მიღება / დაბრუნება","⌖"],["კონტაქტი","☎"],
  ["ფასდაკლების გამოთვლის ლოგიკა","↘"],
] as const;

export default function AdminDashboard(props: {
  email:string;role:string;coverUrl:string;pickupLocations:AdminPickupLocation[];bookings:AdminBooking[];stats:AdminStats;
  content:LocalizedAdminContent;cars:AdminCar[];categories:AdminCategory[];promoCodes:AdminPromoCode[];contact:AdminContact;discountSettings:AdminDiscountSettings;
}) {
  const router=useRouter();
  const [section,setSection]=useState("მთავარი");
  const [cover,setCover]=useState(props.coverUrl);
  const [locations,setLocations]=useState(props.pickupLocations);
  const [bookings,setBookings]=useState(props.bookings);
  const [content,setContent]=useState(props.content);
  const [contentLocale,setContentLocale]=useState<ContentLocale>("en");
  const [cars,setCars]=useState(props.cars);
  const [categories,setCategories]=useState(props.categories);
  const [promoCodes,setPromoCodes]=useState(props.promoCodes);
  const [contact,setContact]=useState(props.contact);
  const [discountSettings,setDiscountSettings]=useState(props.discountSettings);
  const [message,setMessage]=useState("");
  const [bookingActionId,setBookingActionId]=useState("");
  useEffect(()=>{
    const sync=window.setTimeout(()=>setBookings(props.bookings),0);
    return()=>window.clearTimeout(sync);
  },[props.bookings]);
  useEffect(()=>{
    const timer=window.setInterval(()=>router.refresh(),10_000);
    return()=>window.clearInterval(timer);
  },[router]);
  const patch = async (url:string, body:unknown, success:string) => {
    setMessage("ინახება…");
    const response=await fetch(url,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const data=await response.json().catch(()=>({}));
    setMessage(response.ok?success:(data.error||"შენახვა ვერ მოხერხდა."));
    if(response.ok)router.refresh();
    return {response,data};
  };
  const updateBooking=async(id:string,status:"CONFIRMED"|"REJECTED")=>{
    if(bookingActionId)return;
    setBookingActionId(id);
    setMessage(status==="CONFIRMED"?"ჯავშანი დასტურდება და კლიენტს იმეილი ეგზავნება…":"ჯავშანი უარყოფილია და კლიენტს იმეილი ეგზავნება…");
    try{
      const response=await fetch(`/api/admin/bookings/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});
      const data=await response.json().catch(()=>({}));
      if(data.status)setBookings(rows=>rows.map(row=>row.id===id?{...row,status:data.status}:row));
      setMessage(response.ok
        ? data.duplicate?"სტატუსი უკვე დაფიქსირებული იყო — იმეილი მეორედ არ გაგზავნილა.":`სტატუსი შეიცვალა და კლიენტს იმეილი გაეგზავნა.`
        : data.error||"სტატუსის შეცვლა ვერ მოხერხდა.");
    }finally{setBookingActionId("");}
  };
  const deleteBooking=async(id:string)=>{
    if(bookingActionId||!window.confirm("ნამდვილად გსურთ ამ უარყოფილი ჯავშნის წაშლა?"))return;
    setBookingActionId(id);setMessage("ჯავშანი იშლება…");
    try{
      const response=await fetch(`/api/admin/bookings/${id}`,{method:"DELETE"});
      const data=await response.json().catch(()=>({}));
      if(response.ok){setBookings(rows=>rows.filter(row=>row.id!==id));setMessage("უარყოფილი ჯავშანი წაიშალა.");}
      else setMessage(data.error||"ჯავშნის წაშლა ვერ მოხერხდა.");
    }finally{setBookingActionId("");}
  };
  const addCar=()=>{
    setCars(rows=>[...rows,{id:`car-${Date.now()}`,name:"ახალი ავტომობილი",categoryId:categories[0]?.id||"",description:"",dailyPrice:0,engineSpecification:"2.0L",seatCount:5,fuelType:"PETROL",transmission:"AUTOMATIC",isAvailable:true,photos:[]}]);
    setMessage("ახალი ავტომობილის ფორმა დამატებულია — შეავსეთ მონაცემები და ატვირთეთ 1-დან 6-მდე ფოტო.");
  };
  const uploadCarPhotos=async(index:number,files:FileList|null)=>{
    if(!files?.length)return;
    const available=6-(cars[index]?.photos.length||0);
    if(files.length>available){setMessage(`შეგიძლიათ კიდევ მაქსიმუმ ${available} ფოტოს დამატება.`);return;}
    const uploaded:AdminCarPhoto[]=[];
    for(const [fileIndex,file] of Array.from(files).entries()){
      setMessage(`ფოტო იტვირთება ${fileIndex+1}/${files.length}…`);
      const form=new FormData();form.append("photos",file);
      const response=await fetch("/api/admin/cars",{method:"POST",body:form});
      const data=await response.json().catch(()=>({}));
      if(!response.ok){setMessage(data.error||`ფოტო ${fileIndex+1}-ის ატვირთვა ვერ მოხერხდა.`);return;}
      uploaded.push(...data.photos);
    }
    setCars(rows=>rows.map((car,i)=>i===index?{...car,photos:[...car.photos,...uploaded].slice(0,6)}:car));
    setMessage(`${uploaded.length} ფოტო აიტვირთა. ახლა დააჭირეთ „ავტომობილების შენახვას“.`);
  };
  const deleteCar=async(car:AdminCar)=>{
    if(!window.confirm(`ნამდვილად გსურთ „${car.name}“-ის წაშლა? ამ მოქმედების გაუქმება შეუძლებელია.`))return;
    setMessage("ავტომობილი იშლება…");
    const response=await fetch(`/api/admin/cars?id=${encodeURIComponent(car.id)}`,{method:"DELETE"});
    const data=await response.json().catch(()=>({}));
    if(response.ok){
      setCars(rows=>rows.filter(item=>item.id!==car.id));
      setMessage("ავტომობილი და მისი ფოტოები წაიშალა.");
    }else if(response.status===404&&car.id.startsWith("car-")){
      setCars(rows=>rows.filter(item=>item.id!==car.id));
      setMessage("შეუნახავი ავტომობილი წაიშალა.");
    }else setMessage(data.error||"ავტომობილის წაშლა ვერ მოხერხდა.");
  };
  const deleteCategory=async(category:AdminCategory)=>{
    if(!window.confirm(`ნამდვილად გსურთ კატეგორია „${category.name}“-ის წაშლა?`))return;
    setMessage("კატეგორია იშლება…");
    const response=await fetch(`/api/admin/categories?id=${encodeURIComponent(category.id)}`,{method:"DELETE"});
    const data=await response.json().catch(()=>({}));
    if(response.ok){
      setCategories(rows=>rows.filter(item=>item.id!==category.id));
      setMessage("კატეგორია წაიშალა.");
    }else if(response.status===404&&category.id.startsWith("category-")){
      setCategories(rows=>rows.filter(item=>item.id!==category.id));
      setMessage("შეუნახავი კატეგორია წაიშალა.");
    }else setMessage(data.error||"კატეგორიის წაშლა ვერ მოხერხდა.");
  };
  const deletePromoCode=async(promo:AdminPromoCode)=>{
    if(!window.confirm(`ნამდვილად გსურთ პრომო-კოდი „${promo.code}“-ის წაშლა?`))return;
    const response=await fetch(`/api/admin/promo-codes?id=${encodeURIComponent(promo.id)}`,{method:"DELETE"});
    const data=await response.json().catch(()=>({}));
    if(response.ok){
      setPromoCodes(rows=>rows.filter(item=>item.id!==promo.id));
      setMessage(data.archived?"გამოყენებული კოდი გაუქმდა და სიიდან წაიშალა; ჯავშნის ისტორია შენარჩუნებულია.":"პრომო-კოდი წაიშალა.");
    }else if(response.status===404&&promo.id.startsWith("promo-")){
      setPromoCodes(rows=>rows.filter(item=>item.id!==promo.id));setMessage("შეუნახავი პრომო-კოდი წაიშალა.");
    }else setMessage(data.error||"პრომო-კოდის წაშლა ვერ მოხერხდა.");
  };
  const savePromoCodes=async()=>{
    setMessage("პრომო კოდები ინახება…");
    const response=await fetch("/api/admin/promo-codes",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({promoCodes})});
    const data=await response.json().catch(()=>({}));
    if(response.ok){
      if(Array.isArray(data.promoCodes))setPromoCodes(data.promoCodes);
      setMessage("პრომო კოდები შენახულია — ახალი კოდები უკვე აქტიურია საიტზე.");
    }else setMessage(data.error||"პრომო კოდების შენახვა ვერ მოხერხდა.");
  };
  return <main className="admin-shell">
    <aside>
      <Link className="brand admin-brand" href="/"><BrandMark/><span className="brand-name">Geo<span>Rental</span>Cars</span></Link>
      <nav>{sections.map(([name,icon])=><button className={section===name?"active":""} key={name} onClick={()=>{setSection(name);setMessage("")}}><span>{icon}</span>{name}</button>)}</nav>
      <Link className="back-site" href="/">← საჯარო საიტზე დაბრუნება</Link>
    </aside>
    <section className="admin-main">
      <header><div><small>ადმინისტრირების პანელი</small><h1>{section}</h1></div><div className="admin-account"><span>{props.email}</span><button onClick={()=>signOut({callbackUrl:"/admin/login"})}>გასვლა</button></div></header>
      {message&&<p className="admin-message">{message}</p>}
      {section==="მთავარი"&&<><div className="stat-grid"><article><span>ყველა ჯავშანი</span><strong>{bookings.length}</strong><small>სულ მიღებული მოთხოვნა</small></article><article><span>მოლოდინში</span><strong>{bookings.filter(row=>row.status==="PENDING").length}</strong><small>საჭიროებს რეაგირებას</small></article><article><span>დადასტურებული / გაუქმებული</span><strong>{bookings.filter(row=>row.status==="CONFIRMED").length} / {bookings.filter(row=>row.status==="CANCELLED_BY_CUSTOMER").length}</strong><small>მიმდინარე სტატუსები</small></article><article><span>ხელმისაწვდომი მანქანები</span><strong>{props.stats.availableCars}</strong><small>აქტიური ავტომობილები</small></article></div><BookingsTable bookings={bookings.slice(0,8)} onStatus={updateBooking} onDelete={deleteBooking} busyId={bookingActionId} canOverrideConfirmed={props.role==="FULL"}/></>}
      {section==="ჯავშნები"&&<BookingsTable bookings={bookings} onStatus={updateBooking} onDelete={deleteBooking} busyId={bookingActionId} canOverrideConfirmed={props.role==="FULL"}/>}
      {section==="ბუღალტერია"&&<Accounting bookings={bookings}/>}
      {section==="საიტის ტექსტები"&&<Panel title="საიტის ტექსტები — ყველა ენა"><div className="content-language-tabs">{([["en","English"],["ka","ქართული"],["ru","Русский"],["ar","العربية"]] as [ContentLocale,string][]).map(([code,label])=><button type="button" className={contentLocale===code?"active":""} key={code} onClick={()=>setContentLocale(code)}>{label}</button>)}</div><p className="content-language-note">თითოეული ენის ტექსტი დამოუკიდებლად იწერება და ავტომატურად არ ითარგმნება.</p><form className="content-form" dir={contentLocale==="ar"?"rtl":"ltr"} onSubmit={e=>{e.preventDefault();patch("/api/admin/content",{locale:contentLocale,content:content[contentLocale]},`${contentLocale.toUpperCase()} ტექსტები შენახულია.`)}}>
        {([
          ["heroEyebrow","მთავარი — ზედა პატარა ტექსტი"],["heroTitle","მთავარი სათაური"],["heroAccent","იასამნისფერი სათაური"],["heroCopy","მთავარი აღწერა"],
          ["fleetEyebrow","ავტომობილები — პატარა ტექსტი"],["fleetTitle","ავტომობილების სათაური"],["fleetCopy","ავტომობილების აღწერა"],
          ["aboutEyebrow","About — პატარა ტექსტი"],["aboutTitle","About — სათაური"],["aboutCopy","About — აღწერა"],
          ["contactEyebrow","კონტაქტი — პატარა ტექსტი"],["contactTitle","კონტაქტის სათაური"],["contactCopy","კონტაქტის აღწერა"],["footerTagline","Footer-ის ტექსტი"],
        ] as [keyof AdminContent,string][]).map(([key,label])=><label key={key}>{label}{key.endsWith("Copy")?<textarea value={content[contentLocale][key]} onChange={e=>setContent({...content,[contentLocale]:{...content[contentLocale],[key]:e.target.value}})}/>:<input value={content[contentLocale][key]} onChange={e=>setContent({...content,[contentLocale]:{...content[contentLocale],[key]:e.target.value}})}/>}</label>)}<button className="button">{contentLocale.toUpperCase()} ტექსტების შენახვა</button></form></Panel>}
      {section==="ავტომობილები"&&<Panel title="ავტომობილების მართვა" button="+ ავტომობილის დამატება" onButton={addCar}><div className="car-editor">{cars.map((car,index)=><article key={car.id}><div className="admin-photo-manager">
        <div className="admin-photo-grid">{car.photos.map((photo,photoIndex)=><div key={`${photo.publicId}-${photoIndex}`}><Image src={photo.url} alt={`${car.name} ${photoIndex+1}`} fill sizes="110px"/><button type="button" onClick={()=>setCars(rows=>rows.map((item,i)=>i===index?{...item,photos:item.photos.filter((_,p)=>p!==photoIndex)}:item))}>×</button></div>)}</div>
        <label className="photo-upload">1–6 ფოტოს ატვირთვა<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>uploadCarPhotos(index,e.target.files)}/></label>
        <small>{car.photos.length}/6 ფოტო</small>
      </div><div className="editor-grid">
        <label>დასახელება<input value={car.name} onChange={e=>setCars(v=>v.map((x,i)=>i===index?{...x,name:e.target.value}:x))}/></label>
        <label>კატეგორია<select value={car.categoryId} onChange={e=>setCars(v=>v.map((x,i)=>i===index?{...x,categoryId:e.target.value}:x))}>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>ფასი დღეში ($)<input type="number" value={car.dailyPrice} onChange={e=>setCars(v=>v.map((x,i)=>i===index?{...x,dailyPrice:Number(e.target.value)}:x))}/></label>
        <label>ძრავი<input value={car.engineSpecification} onChange={e=>setCars(v=>v.map((x,i)=>i===index?{...x,engineSpecification:e.target.value}:x))}/></label>
        <label>ადგილები<input type="number" value={car.seatCount} onChange={e=>setCars(v=>v.map((x,i)=>i===index?{...x,seatCount:Number(e.target.value)}:x))}/></label>
        <label>საწვავი<select value={car.fuelType} onChange={e=>setCars(v=>v.map((x,i)=>i===index?{...x,fuelType:e.target.value as "PETROL"|"DIESEL"}:x))}><option value="PETROL">ბენზინი / ჰიბრიდი</option><option value="DIESEL">დიზელი</option></select></label>
        <label>ტრანსმისია<select value={car.transmission} onChange={e=>setCars(v=>v.map((x,i)=>i===index?{...x,transmission:e.target.value as "AUTOMATIC"|"MANUAL"}:x))}><option value="AUTOMATIC">ავტომატიკა</option><option value="MANUAL">მექანიკა</option></select></label>
        <label className="wide">აღწერა<textarea value={car.description} onChange={e=>setCars(v=>v.map((x,i)=>i===index?{...x,description:e.target.value}:x))}/></label>
        <label className="toggle"><input type="checkbox" checked={car.isAvailable} onChange={e=>setCars(v=>v.map((x,i)=>i===index?{...x,isAvailable:e.target.checked}:x))}/> ხელმისაწვდომია</label>
        <button type="button" className="delete-car" onClick={()=>deleteCar(car)}>ავტომობილის წაშლა</button>
      </div></article>)}</div><button className="button save-list" onClick={()=>patch("/api/admin/cars",{cars},"ავტომობილები შენახულია.")}>ავტომობილების შენახვა</button></Panel>}
      {section==="კატეგორიები"&&<Panel title="კატეგორიების მართვა" button="+ კატეგორიის დამატება" onButton={()=>setCategories(v=>[...v,{id:`category-${Date.now()}`,name:"ახალი კატეგორია"}])}><div className="category-editor">{categories.map((category,index)=><div className="category-row" key={category.id}><label>კატეგორიის სახელი<input value={category.name} onChange={e=>setCategories(v=>v.map((x,i)=>i===index?{...x,name:e.target.value}:x))}/></label><button type="button" onClick={()=>deleteCategory(category)}>წაშლა</button></div>)}</div><button className="button save-list" onClick={()=>patch("/api/admin/categories",{categories},"კატეგორიები შენახულია.")}>კატეგორიების შენახვა</button></Panel>}
      {section==="პრომო კოდები"&&<Panel title="პრომო კოდების მართვა" button="+ პრომო კოდის დამატება" onButton={()=>setPromoCodes(v=>[{id:`promo-${Date.now()}`,code:"",companyName:"",discountPercent:10,isActive:true},...v])}><div className="promo-editor">{promoCodes.map((promo,index)=><article key={promo.id}>
        <label>კოდი<input value={promo.code} onChange={e=>setPromoCodes(v=>v.map((x,i)=>i===index?{...x,code:e.target.value.toUpperCase()}:x))}/></label>
        <label>კომპანია / აღწერა<input value={promo.companyName} onChange={e=>setPromoCodes(v=>v.map((x,i)=>i===index?{...x,companyName:e.target.value}:x))}/></label>
        <label>ფასდაკლება % (მაქს. 20)<input type="number" min="0" max="20" value={promo.discountPercent} onChange={e=>setPromoCodes(v=>v.map((x,i)=>i===index?{...x,discountPercent:Number(e.target.value)}:x))}/></label>
        <label className="toggle"><input type="checkbox" checked={promo.isActive} onChange={e=>setPromoCodes(v=>v.map((x,i)=>i===index?{...x,isActive:e.target.checked}:x))}/> აქტიურია</label>
        <button type="button" onClick={()=>deletePromoCode(promo)}>წაშლა</button>
      </article>)}</div><button className="button save-list" onClick={savePromoCodes}>პრომო კოდების შენახვა და გააქტიურება</button></Panel>}
      {section==="ფასდაკლების გამოთვლის ლოგიკა"&&<Panel title="ფასდაკლების გამოთვლის ლოგიკა"><p className="discount-help">ფასდაკლება იწყება მითითებული დღიდან. შემდეგ ყოველ დამატებულ დღეზე ემატება თქვენ მიერ განსაზღვრული პროცენტი, მაგრამ 30-ე დღის შემდეგ აღარ იზრდება და მაქსიმალურ ზღვარს არ სცდება.</p><form className="discount-settings-form" onSubmit={e=>{e.preventDefault();patch("/api/admin/discount-settings",discountSettings,"ფასდაკლების გამოთვლის ლოგიკა შენახულია.")}}>
        <label>ფასდაკლების დაწყების დღე<input type="number" min="1" max="30" required value={discountSettings.startDay} onChange={e=>setDiscountSettings({...discountSettings,startDay:Number(e.target.value)})}/></label>
        <label>საწყისი ფასდაკლება (%)<input type="number" min="0" max="100" step="0.01" required value={discountSettings.basePercent} onChange={e=>setDiscountSettings({...discountSettings,basePercent:Number(e.target.value)})}/></label>
        <label>ყოველ დამატებით დღეზე (%)<input type="number" min="0" max="100" step="0.01" required value={discountSettings.incrementPerDay} onChange={e=>setDiscountSettings({...discountSettings,incrementPerDay:Number(e.target.value)})}/></label>
        <label>მაქსიმალური ფასდაკლება (%)<input type="number" min="0" max="100" step="0.01" required value={discountSettings.maxPercent} onChange={e=>setDiscountSettings({...discountSettings,maxPercent:Number(e.target.value)})}/></label>
        <div className="discount-preview"><small>მაგალითი</small><strong>{discountSettings.startDay} დღე — {discountSettings.basePercent}%</strong><span>{Math.min(30,discountSettings.startDay+1)} დღე — {Math.min(discountSettings.maxPercent,discountSettings.basePercent+discountSettings.incrementPerDay)}%</span><span>30+ დღე — {Math.min(discountSettings.maxPercent,discountSettings.basePercent+Math.max(0,30-discountSettings.startDay)*discountSettings.incrementPerDay)}%</span></div>
        <button className="button">ლოგიკის შენახვა</button>
      </form></Panel>}
      {section==="ქოვერის ფოტო"&&<Panel title="მთავარი ქოვერის ფოტო"><form className="cover-form" onSubmit={async e=>{e.preventDefault();setMessage("იტვირთება…");const r=await fetch("/api/admin/site-settings",{method:"POST",body:new FormData(e.currentTarget)});const d=await r.json();if(r.ok){setCover(d.heroImageUrl);setMessage("ქოვერი განახლებულია.")}else setMessage(d.error||"ატვირთვა ვერ მოხერხდა.")}}><Image src={cover} alt="მიმდინარე ქოვერი" width={760} height={300}/><label>აირჩიეთ JPG, PNG ან WebP (მაქს. 10 MB)<input name="cover" type="file" accept="image/jpeg,image/png,image/webp" required/></label><button className="button">ახალი ქოვერის ატვირთვა</button></form></Panel>}
      {section==="მიღება / დაბრუნება"&&<Panel title="ლოკაციები და დამატებითი საფასური"><form className="location-settings" onSubmit={e=>{e.preventDefault();patch("/api/admin/pickup-locations",{locations},"ლოკაციები შენახულია.")}}>{locations.map((location,index)=><div key={location.id} className="location-editor"><label className="location-toggle"><input type="checkbox" checked={location.isActive} onChange={e=>setLocations(v=>v.map((x,i)=>i===index?{...x,isActive:e.target.checked}:x))}/><span>აქტიური ლოკაცია</span></label>{([["nameKa","ქართული"],["nameEn","English"],["nameRu","Русский"],["nameAr","العربية"]] as [keyof AdminPickupLocation,string][]).map(([key,label])=><label key={String(key)}>{label}<input value={String(location[key])} onChange={e=>setLocations(v=>v.map((x,i)=>i===index?{...x,[key]:e.target.value}:x))}/></label>)}<label>დამატებითი თანხა ($)<input type="number" min="0" value={location.fee} onChange={e=>setLocations(v=>v.map((x,i)=>i===index?{...x,fee:Number(e.target.value)}:x))}/></label></div>)}<button className="button">ლოკაციების შენახვა</button></form></Panel>}
      {section==="კონტაქტი"&&<Panel title="საკონტაქტო ინფორმაციის მართვა"><form className="settings-form" onSubmit={async e=>{e.preventDefault();const {response,data}=await patch("/api/admin/contact",contact,"საკონტაქტო ინფორმაცია შენახულია და საიტზე განახლდა.");if(response.ok&&data.contact)setContact(data.contact)}}>
        <label>ოფისის მისამართი<input required value={contact.address} onChange={e=>setContact({...contact,address:e.target.value})}/></label>
        <label>Google Maps-ის ბმული — ნებაყოფლობითი<input type="url" placeholder="ცარიელის შემთხვევაში შეიქმნება მისამართიდან" value={contact.googleMapsUrl} onChange={e=>setContact({...contact,googleMapsUrl:e.target.value})}/></label>
        <label>ტელეფონი<input required type="tel" placeholder="+995592710606" value={contact.phone} onChange={e=>setContact({...contact,phone:e.target.value})}/></label>
        <label>WhatsApp — ნებაყოფლობითი<input type="tel" placeholder="ცარიელის შემთხვევაში გამოიყენება ტელეფონი" value={contact.whatsapp} onChange={e=>setContact({...contact,whatsapp:e.target.value})}/></label>
        <button className="button">კონტაქტის შენახვა</button>
      </form></Panel>}
    </section>
  </main>;
}
function Panel({title,button,onButton,children}:{title:string;button?:string;onButton?:()=>void;children:React.ReactNode}){return <section className="admin-panel"><div className="panel-head"><h2>{title}</h2>{button&&<button type="button" className="button compact" onClick={onButton}>{button}</button>}</div>{children}</section>}
function BookingsTable({bookings,onStatus,onDelete,busyId,canOverrideConfirmed}:{bookings:AdminBooking[];onStatus:(id:string,status:"CONFIRMED"|"REJECTED")=>void;onDelete:(id:string)=>void;busyId:string;canOverrideConfirmed:boolean}){return <section className="admin-panel"><div className="panel-head"><div><small>მიმდინარე ოპერაციები</small><h2>ბოლო ჯავშნები</h2></div></div><div className="table-wrap"><table><thead><tr><th>ჯავშნის კოდი</th><th>მომხმარებელი</th><th>მანქანა</th><th>თარიღები</th><th>პრომო</th><th>ჯამი</th><th>სტატუსი</th><th>ვინ გააუქმა / დრო</th><th>მოქმედება</th></tr></thead><tbody>{bookings.length?bookings.map(row=><tr key={row.id}><td><b>{row.bookingCode}</b></td><td>{row.customer}</td><td>{row.car}</td><td>{row.dates}</td><td>{row.promoCode?<span className="promo-used"><b>{row.promoCode}</b><small>{row.promoCompany} · {row.promoPercent}%</small></span>:<span className="promo-none">არ გამოუყენებია</span>}</td><td>${row.totalPrice.toFixed(2)}</td><td><span className={`status ${row.status.toLowerCase()}`}>{({PENDING:"მოლოდინში",CONFIRMED:"დადასტურებული",REJECTED:"უარყოფილი",CANCELLED_BY_CUSTOMER:"მომხმარებლის მიერ გაუქმებული"} as Record<string,string>)[row.status]||row.status}</span></td><td>{row.cancelledBy?<span className="cancelled-meta"><b>{row.cancelledBy}</b><small>{row.cancelledAt?new Date(row.cancelledAt).toLocaleString("ka-GE",{timeZone:"Asia/Tbilisi"}):"—"}</small></span>:"—"}</td><td><div className="booking-actions">{["PENDING","CONFIRMED"].includes(row.status)&&<><button disabled={Boolean(busyId)} onClick={()=>onStatus(row.id,"CONFIRMED")}>{busyId===row.id?"მუშავდება…":"დადასტურება"}</button>{(row.status!=="CONFIRMED"||canOverrideConfirmed)&&<button disabled={Boolean(busyId)} onClick={()=>onStatus(row.id,"REJECTED")}>{busyId===row.id?"მუშავდება…":"უარყოფა"}</button>}</>}{row.status==="REJECTED"&&<button className="delete-booking" disabled={Boolean(busyId)} onClick={()=>onDelete(row.id)}>{busyId===row.id?"იშლება…":"წაშლა"}</button>}</div></td></tr>):<tr><td colSpan={9}>ჯავშნები ჯერ არ არის.</td></tr>}</tbody></table></div></section>}

function Accounting({bookings}:{bookings:AdminBooking[]}){
  const today=new Date().toISOString().slice(0,10);
  const monthStart=`${today.slice(0,7)}-01`;
  const [from,setFrom]=useState(monthStart);
  const [to,setTo]=useState(today);
  const filtered=useMemo(()=>bookings.filter(row=>(!from||row.createdAt>=from)&&(!to||row.createdAt<=to)),[bookings,from,to]);
  const confirmed=filtered.filter(row=>row.status==="CONFIRMED");
  const promoBookings=confirmed.filter(row=>row.promoCode);
  const sum=(key:keyof Pick<AdminBooking,"totalPrice"|"promoAmount"|"grossCommission"|"netCommission"|"companyRevenue"|"fees">)=>confirmed.reduce((total,row)=>total+row[key],0);
  const money=(value:number)=>`$${value.toFixed(2)}`;
  const companies=(()=>{
    const result=new Map<string,{company:string;code:string;uses:number;discount:number;revenue:number}>();
    for(const row of promoBookings){
      const key=`${row.promoCompany||"—"}::${row.promoCode||"—"}`;
      const current=result.get(key)||{company:row.promoCompany||"—",code:row.promoCode||"—",uses:0,discount:0,revenue:0};
      current.uses+=1;current.discount+=row.promoAmount;current.revenue+=row.totalPrice;result.set(key,current);
    }
    return [...result.values()].sort((a,b)=>b.uses-a.uses);
  })();
  return <>
    <section className="admin-panel accounting-filter"><div><small>საანგარიშო პერიოდი</small><h2>ბუღალტერიის ანგარიში</h2></div><label>დან<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>მდე<input type="date" value={to} min={from} onChange={e=>setTo(e.target.value)}/></label><button type="button" onClick={()=>{setFrom("");setTo("")}}>მთელი პერიოდი</button></section>
    <div className="accounting-stats">
      <article><span>შემოსული ჯავშნები</span><strong>{filtered.length}</strong><small>არჩეულ პერიოდში</small></article>
      <article><span>დადასტურებული</span><strong>{confirmed.length}</strong><small>ფინანსურ ანგარიშში შესული</small></article>
      <article><span>პრომოს გამოყენება</span><strong>{promoBookings.length}</strong><small>მხოლოდ დადასტურებული</small></article>
      <article><span>კლიენტების გადახდილი</span><strong>{money(sum("totalPrice"))}</strong><small>ქირა და ყველა საფასური</small></article>
      <article><span>თქვენი საწყისი 20%</span><strong>{money(sum("grossCommission"))}</strong><small>პრომოს ჩამოკლებამდე</small></article>
      <article><span>პრომოების ხარჯი</span><strong>−{money(sum("promoAmount"))}</strong><small>თქვენი 20%-დან</small></article>
      <article className="primary"><span>თქვენი წმინდა შემოსავალი</span><strong>{money(sum("netCommission"))}</strong><small>20% მინუს პრომო</small></article>
      <article><span>კომპანიის შემოსავალი</span><strong>{money(sum("companyRevenue"))}</strong><small>მიღება/დაბრუნების ჩათვლით</small></article>
      <article><span>მიღება / დაბრუნება</span><strong>{money(sum("fees"))}</strong><small>სრულად კომპანიისაა</small></article>
    </div>
    <section className="admin-panel"><div className="panel-head"><div><small>პარტნიორების ანგარიში</small><h2>პრომო კოდების გამოყენება კომპანიების მიხედვით</h2></div></div><div className="table-wrap"><table><thead><tr><th>კომპანია</th><th>პრომო კოდი</th><th>გამოყენება</th><th>ფასდაკლების ჯამი</th><th>ჯავშნების მიღებული თანხა</th></tr></thead><tbody>{companies.length?companies.map(row=><tr key={`${row.company}-${row.code}`}><td><b>{row.company}</b></td><td>{row.code}</td><td>{row.uses}</td><td>{money(row.discount)}</td><td>{money(row.revenue)}</td></tr>):<tr><td colSpan={5}>არჩეულ პერიოდში დადასტურებულ ჯავშნებზე პრომო კოდი არ გამოყენებულა.</td></tr>}</tbody></table></div></section>
    <section className="admin-panel"><div className="panel-head"><div><small>დეტალური კალკულაცია</small><h2>დადასტურებული ჯავშნები</h2></div></div><div className="table-wrap"><table><thead><tr><th>ჯავშანი</th><th>თარიღი</th><th>კლიენტი</th><th>საკომისიოს ბაზა</th><th>20%</th><th>პრომო</th><th>თქვენი წმინდა</th><th>კომპანია</th></tr></thead><tbody>{confirmed.length?confirmed.map(row=><tr key={row.id}><td><b>{row.id.slice(-8).toUpperCase()}</b></td><td>{row.createdAt}</td><td>{row.customer}</td><td>{money(row.commissionBase)}</td><td>{money(row.grossCommission)}</td><td>{row.promoCode?`${row.promoCode} (−${money(row.promoAmount)})`:"—"}</td><td><b>{money(row.netCommission)}</b></td><td>{money(row.companyRevenue)}</td></tr>):<tr><td colSpan={8}>არჩეულ პერიოდში დადასტურებული ჯავშნები არ არის.</td></tr>}</tbody></table></div></section>
  </>;
}
