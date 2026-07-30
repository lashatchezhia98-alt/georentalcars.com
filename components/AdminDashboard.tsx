"use client";
import { useState } from "react";
import BrandMark from "@/components/BrandMark";
import { signOut } from "next-auth/react";

type AdminPickupLocation = { id:string;nameKa:string;nameEn:string;nameRu:string;nameAr:string;fee:number;isActive:boolean };
type AdminBooking = { id: string; customer: string; car: string; dates: string; status: string; price: string };
type AdminStats = { total: number; pending: number; confirmed: number; rejected: number; availableCars: number };
type AdminContent = { heroEyebrow:string;heroTitle:string;heroAccent:string;heroCopy:string;fleetEyebrow:string;fleetTitle:string;fleetCopy:string;aboutEyebrow:string;aboutTitle:string;aboutCopy:string;contactEyebrow:string;contactTitle:string;contactCopy:string;footerTagline:string };
type ContentLocale = "en"|"ka"|"ru"|"ar";
type LocalizedAdminContent = Record<ContentLocale,AdminContent>;
type AdminCategory = { id:string;name:string };
type AdminPromoCode = { id:string;code:string;companyName:string;discountPercent:number;isActive:boolean };
type AdminCarPhoto = { url:string;publicId:string };
type AdminCar = { id:string;name:string;categoryId:string;description:string;dailyPrice:number;engineSpecification:string;seatCount:number;fuelType:"PETROL"|"DIESEL";transmission:"AUTOMATIC"|"MANUAL";isAvailable:boolean;photos:AdminCarPhoto[] };
type AdminContact = { address:string;googleMapsUrl:string;phone:string;whatsapp:string };

const sections = [
  ["მთავარი","⌂"],["ჯავშნები","▤"],["ავტომობილები","◇"],["კატეგორიები","◫"],["საიტის ტექსტები","✎"],
  ["პრომო კოდები","%"],["ქოვერის ფოტო","▧"],["მიღება / დაბრუნება","⌖"],["კონტაქტი","☎"],
] as const;

export default function AdminDashboard(props: {
  email:string;coverUrl:string;pickupLocations:AdminPickupLocation[];bookings:AdminBooking[];stats:AdminStats;
  content:LocalizedAdminContent;cars:AdminCar[];categories:AdminCategory[];promoCodes:AdminPromoCode[];contact:AdminContact;
}) {
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
  const [message,setMessage]=useState("");
  const patch = async (url:string, body:unknown, success:string) => {
    setMessage("ინახება…");
    const response=await fetch(url,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const data=await response.json().catch(()=>({}));
    setMessage(response.ok?success:(data.error||"შენახვა ვერ მოხერხდა."));
  };
  const updateBooking=async(id:string,status:"CONFIRMED"|"REJECTED")=>{
    const response=await fetch(`/api/admin/bookings/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});
    if(response.ok)setBookings(rows=>rows.map(row=>row.id===id?{...row,status}:row));
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
      setPromoCodes(rows=>data.archived?rows.map(item=>item.id===promo.id?{...item,isActive:false}:item):rows.filter(item=>item.id!==promo.id));
      setMessage(data.archived?"გამოყენებული კოდი გაუქმდა და აღარ იმუშავებს.":"პრომო-კოდი წაიშალა.");
    }else if(response.status===404&&promo.id.startsWith("promo-")){
      setPromoCodes(rows=>rows.filter(item=>item.id!==promo.id));setMessage("შეუნახავი პრომო-კოდი წაიშალა.");
    }else setMessage(data.error||"პრომო-კოდის წაშლა ვერ მოხერხდა.");
  };
  return <main className="admin-shell">
    <aside>
      <a className="brand admin-brand" href="/"><BrandMark/><span className="brand-name">Geo<span>Rental</span>Cars</span></a>
      <nav>{sections.map(([name,icon])=><button className={section===name?"active":""} key={name} onClick={()=>{setSection(name);setMessage("")}}><span>{icon}</span>{name}</button>)}</nav>
      <a className="back-site" href="/">← საჯარო საიტზე დაბრუნება</a>
    </aside>
    <section className="admin-main">
      <header><div><small>ადმინისტრირების პანელი</small><h1>{section}</h1></div><div className="admin-account"><span>{props.email}</span><button onClick={()=>signOut({callbackUrl:"/admin/login"})}>გასვლა</button></div></header>
      {message&&<p className="admin-message">{message}</p>}
      {section==="მთავარი"&&<><div className="stat-grid"><article><span>ყველა ჯავშანი</span><strong>{props.stats.total}</strong><small>სულ მიღებული მოთხოვნა</small></article><article><span>მოლოდინში</span><strong>{props.stats.pending}</strong><small>საჭიროებს რეაგირებას</small></article><article><span>დადასტურებული / უარყოფილი</span><strong>{props.stats.confirmed} / {props.stats.rejected}</strong><small>მიმდინარე სტატუსები</small></article><article><span>ხელმისაწვდომი მანქანები</span><strong>{props.stats.availableCars}</strong><small>აქტიური ავტომობილები</small></article></div><BookingsTable bookings={bookings.slice(0,8)} onStatus={updateBooking}/></>}
      {section==="ჯავშნები"&&<BookingsTable bookings={bookings} onStatus={updateBooking}/>}
      {section==="საიტის ტექსტები"&&<Panel title="საიტის ტექსტები — ყველა ენა"><div className="content-language-tabs">{([["en","English"],["ka","ქართული"],["ru","Русский"],["ar","العربية"]] as [ContentLocale,string][]).map(([code,label])=><button type="button" className={contentLocale===code?"active":""} key={code} onClick={()=>setContentLocale(code)}>{label}</button>)}</div><p className="content-language-note">თითოეული ენის ტექსტი დამოუკიდებლად იწერება და ავტომატურად არ ითარგმნება.</p><form className="content-form" dir={contentLocale==="ar"?"rtl":"ltr"} onSubmit={e=>{e.preventDefault();patch("/api/admin/content",content,"ყველა ენის ტექსტები შენახულია.")}}>
        {([
          ["heroEyebrow","მთავარი — ზედა პატარა ტექსტი"],["heroTitle","მთავარი სათაური"],["heroAccent","იასამნისფერი სათაური"],["heroCopy","მთავარი აღწერა"],
          ["fleetEyebrow","ავტომობილები — პატარა ტექსტი"],["fleetTitle","ავტომობილების სათაური"],["fleetCopy","ავტომობილების აღწერა"],
          ["aboutEyebrow","About — პატარა ტექსტი"],["aboutTitle","About — სათაური"],["aboutCopy","About — აღწერა"],
          ["contactEyebrow","კონტაქტი — პატარა ტექსტი"],["contactTitle","კონტაქტის სათაური"],["contactCopy","კონტაქტის აღწერა"],["footerTagline","Footer-ის ტექსტი"],
        ] as [keyof AdminContent,string][]).map(([key,label])=><label key={key}>{label}{key.endsWith("Copy")?<textarea value={content[contentLocale][key]} onChange={e=>setContent({...content,[contentLocale]:{...content[contentLocale],[key]:e.target.value}})}/>:<input value={content[contentLocale][key]} onChange={e=>setContent({...content,[contentLocale]:{...content[contentLocale],[key]:e.target.value}})}/>}</label>)}<button className="button">ყველა ენის ტექსტების შენახვა</button></form></Panel>}
      {section==="ავტომობილები"&&<Panel title="ავტომობილების მართვა" button="+ ავტომობილის დამატება" onButton={addCar}><div className="car-editor">{cars.map((car,index)=><article key={car.id}><div className="admin-photo-manager">
        <div className="admin-photo-grid">{car.photos.map((photo,photoIndex)=><div key={`${photo.publicId}-${photoIndex}`}><img src={photo.url} alt={`${car.name} ${photoIndex+1}`}/><button type="button" onClick={()=>setCars(rows=>rows.map((item,i)=>i===index?{...item,photos:item.photos.filter((_,p)=>p!==photoIndex)}:item))}>×</button></div>)}</div>
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
        <label>ფასდაკლება %<input type="number" min="0" max="100" value={promo.discountPercent} onChange={e=>setPromoCodes(v=>v.map((x,i)=>i===index?{...x,discountPercent:Number(e.target.value)}:x))}/></label>
        <label className="toggle"><input type="checkbox" checked={promo.isActive} onChange={e=>setPromoCodes(v=>v.map((x,i)=>i===index?{...x,isActive:e.target.checked}:x))}/> აქტიურია</label>
        <button type="button" onClick={()=>deletePromoCode(promo)}>წაშლა</button>
      </article>)}</div><button className="button save-list" onClick={()=>patch("/api/admin/promo-codes",{promoCodes},"პრომო კოდები შენახულია.")}>პრომო კოდების შენახვა</button></Panel>}
      {section==="ქოვერის ფოტო"&&<Panel title="მთავარი ქოვერის ფოტო"><form className="cover-form" onSubmit={async e=>{e.preventDefault();setMessage("იტვირთება…");const r=await fetch("/api/admin/site-settings",{method:"POST",body:new FormData(e.currentTarget)});const d=await r.json();if(r.ok){setCover(d.heroImageUrl);setMessage("ქოვერი განახლებულია.")}else setMessage(d.error||"ატვირთვა ვერ მოხერხდა.")}}><img src={cover} alt="მიმდინარე ქოვერი"/><label>აირჩიეთ JPG, PNG ან WebP (მაქს. 10 MB)<input name="cover" type="file" accept="image/jpeg,image/png,image/webp" required/></label><button className="button">ახალი ქოვერის ატვირთვა</button></form></Panel>}
      {section==="მიღება / დაბრუნება"&&<Panel title="ლოკაციები და დამატებითი საფასური"><form className="location-settings" onSubmit={e=>{e.preventDefault();patch("/api/admin/pickup-locations",{locations},"ლოკაციები შენახულია.")}}>{locations.map((location,index)=><div key={location.id} className="location-editor"><label className="location-toggle"><input type="checkbox" checked={location.isActive} onChange={e=>setLocations(v=>v.map((x,i)=>i===index?{...x,isActive:e.target.checked}:x))}/><span>აქტიური ლოკაცია</span></label>{([["nameKa","ქართული"],["nameEn","English"],["nameRu","Русский"],["nameAr","العربية"]] as [keyof AdminPickupLocation,string][]).map(([key,label])=><label key={String(key)}>{label}<input value={String(location[key])} onChange={e=>setLocations(v=>v.map((x,i)=>i===index?{...x,[key]:e.target.value}:x))}/></label>)}<label>დამატებითი თანხა ($)<input type="number" min="0" value={location.fee} onChange={e=>setLocations(v=>v.map((x,i)=>i===index?{...x,fee:Number(e.target.value)}:x))}/></label></div>)}<button className="button">ლოკაციების შენახვა</button></form></Panel>}
      {section==="კონტაქტი"&&<Panel title="საკონტაქტო ინფორმაციის მართვა"><form className="settings-form" onSubmit={e=>{e.preventDefault();patch("/api/admin/contact",contact,"საკონტაქტო ინფორმაცია შენახულია.")}}>{([["address","ოფისის მისამართი"],["googleMapsUrl","Google Maps-ის ბმული"],["phone","ტელეფონი"],["whatsapp","WhatsApp"]] as [keyof AdminContact,string][]).map(([key,label])=><label key={key}>{label}<input value={contact[key]} onChange={e=>setContact({...contact,[key]:e.target.value})}/></label>)}<button className="button">კონტაქტის შენახვა</button></form></Panel>}
    </section>
  </main>;
}
function Panel({title,button,onButton,children}:{title:string;button?:string;onButton?:()=>void;children:React.ReactNode}){return <section className="admin-panel"><div className="panel-head"><h2>{title}</h2>{button&&<button type="button" className="button compact" onClick={onButton}>{button}</button>}</div>{children}</section>}
function BookingsTable({bookings,onStatus}:{bookings:AdminBooking[];onStatus:(id:string,status:"CONFIRMED"|"REJECTED")=>void}){return <section className="admin-panel"><div className="panel-head"><div><small>მიმდინარე ოპერაციები</small><h2>ბოლო ჯავშნები</h2></div></div><div className="table-wrap"><table><thead><tr><th>ჯავშანი</th><th>მომხმარებელი</th><th>მანქანა</th><th>თარიღები</th><th>ჯამი</th><th>სტატუსი</th><th>მოქმედება</th></tr></thead><tbody>{bookings.length?bookings.map(row=><tr key={row.id}><td><b>{row.id.slice(-8).toUpperCase()}</b></td><td>{row.customer}</td><td>{row.car}</td><td>{row.dates}</td><td>{row.price}</td><td><span className={`status ${row.status.toLowerCase()}`}>{({PENDING:"მოლოდინში",CONFIRMED:"დადასტურებული",REJECTED:"უარყოფილი"} as Record<string,string>)[row.status]||row.status}</span></td><td><div className="booking-actions"><button onClick={()=>onStatus(row.id,"CONFIRMED")}>დადასტურება</button><button onClick={()=>onStatus(row.id,"REJECTED")}>უარყოფა</button></div></td></tr>):<tr><td colSpan={7}>ჯავშნები ჯერ არ არის.</td></tr>}</tbody></table></div></section>}
