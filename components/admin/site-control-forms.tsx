"use client";

import { useState } from "react";
import { SectionEditor } from "@/components/dashboard/section-editor";
import type { Section } from "@/lib/sections/definitions";
import type { WebsiteType } from "@/lib/types";
import { useRouter } from "next/navigation";

const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
const button = "rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50";

async function save(storeId: string, payload: Record<string, unknown>) {
  const res = await fetch(`/api/admin/stores/${storeId}/control`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: { message?: string } | string };
  if (!res.ok || !data.ok) {
    const message = typeof data.error === "string" ? data.error : data.error?.message;
    throw new Error(message || "Enregistrement impossible");
  }
}

export function StoreSettingsEditor({ storeId, store }: { storeId: string; store: Record<string, unknown> }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: String(store.name ?? ""),
    slug: String(store.slug ?? ""),
    language: String(store.language ?? "fr"),
    currency: String(store.currency ?? "DZD"),
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setMessage("");
      try {
        await save(storeId, { action: "store", ...form });
        setMessage("Enregistré.");
        router.refresh();
      } catch (err) { setMessage(err instanceof Error ? err.message : "Erreur"); }
      finally { setBusy(false); }
    }}>
      <label className="text-sm font-medium">Nom<input className={input} value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/></label>
      <label className="text-sm font-medium">Slug<input className={input} value={form.slug} onChange={(e)=>setForm({...form,slug:e.target.value})}/></label>
      <label className="text-sm font-medium">Langue<select className={input} value={form.language} onChange={(e)=>setForm({...form,language:e.target.value})}><option value="fr">Français</option><option value="ar">العربية</option><option value="en">English</option></select></label>
      <label className="text-sm font-medium">Devise<input className={input} value={form.currency} onChange={(e)=>setForm({...form,currency:e.target.value.toUpperCase()})}/></label>
      <div className="md:col-span-2 flex items-center gap-3"><button className={button} disabled={busy}>{busy?"Enregistrement…":"Enregistrer le site"}</button>{message&&<span className="text-sm text-slate-500">{message}</span>}</div>
    </form>
  );
}

export function ThemeEditor({ storeId, theme }: { storeId: string; theme: Record<string, unknown> | null }) {
  const router = useRouter();
  const [form, setForm] = useState({
    logo_url: String(theme?.logo_url ?? ""),
    favicon_url: String(theme?.favicon_url ?? ""),
    primary_color: String(theme?.primary_color ?? "#1d4ed8"),
    secondary_color: String(theme?.secondary_color ?? "#f59e0b"),
    background_color: String(theme?.background_color ?? "#ffffff"),
    typography: String(theme?.typography ?? "modern"),
    button_shape: String(theme?.button_shape ?? "rounded"),
    announcement: String(theme?.announcement ?? ""),
  });
  const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={async(e)=>{
      e.preventDefault(); setBusy(true); setMessage("");
      try{ await save(storeId,{action:"theme",...form}); setMessage("Apparence enregistrée."); router.refresh(); }
      catch(err){ setMessage(err instanceof Error?err.message:"Erreur"); } finally{setBusy(false);}
    }}>
      <label className="text-sm font-medium">Logo URL<input className={input} value={form.logo_url} onChange={(e)=>setForm({...form,logo_url:e.target.value})}/></label>
      <label className="text-sm font-medium">Favicon URL<input className={input} value={form.favicon_url} onChange={(e)=>setForm({...form,favicon_url:e.target.value})}/></label>
      {(["primary_color","secondary_color","background_color"] as const).map((key)=><label key={key} className="text-sm font-medium">{key.replace("_"," ")}<div className="flex gap-2"><input type="color" className="h-10 w-12" value={form[key]} onChange={(e)=>setForm({...form,[key]:e.target.value})}/><input className={input} value={form[key]} onChange={(e)=>setForm({...form,[key]:e.target.value})}/></div></label>)}
      <label className="text-sm font-medium">Typographie<select className={input} value={form.typography} onChange={(e)=>setForm({...form,typography:e.target.value})}><option value="modern">Modern</option><option value="elegant">Elegant</option><option value="bold">Bold</option><option value="minimal">Minimal</option></select></label>
      <label className="text-sm font-medium">Boutons<select className={input} value={form.button_shape} onChange={(e)=>setForm({...form,button_shape:e.target.value})}><option value="rounded">Rounded</option><option value="sharp">Sharp</option><option value="pill">Pill</option></select></label>
      <label className="text-sm font-medium md:col-span-2">Barre d'annonce<input className={input} value={form.announcement} onChange={(e)=>setForm({...form,announcement:e.target.value})}/></label>
      <div className="md:col-span-2 flex items-center gap-3"><button className={button} disabled={busy}>{busy?"Enregistrement…":"Enregistrer l'apparence"}</button>{message&&<span className="text-sm text-slate-500">{message}</span>}</div>
    </form>
  );
}

export function ProductQuickEditor({ storeId, products, categories }: { storeId:string; products:Array<Record<string,unknown>>; categories:Array<Record<string,unknown>> }) {
  const router=useRouter();
  const [rows,setRows]=useState(products.map((p)=>({
    id:String(p.id), name:String(p.name??""), price:Number(p.price_cents??0)/100,
    compare_at_price:p.compare_at_price_cents==null?"":String(Number(p.compare_at_price_cents)/100),
    stock:Number(p.stock??0), category_id:String(p.category_id??""), is_active:Boolean(p.is_active), is_featured:Boolean(p.is_featured),
  })));
  const [message,setMessage]=useState("");
  async function persist(row:(typeof rows)[number]){
    setMessage("");
    try{
      await save(storeId,{action:"product",product_id:row.id,name:row.name,price:Number(row.price),compare_at_price:row.compare_at_price?Number(row.compare_at_price):null,stock:Number(row.stock),category_id:row.category_id||null,is_active:row.is_active,is_featured:row.is_featured});
      setMessage("Produit enregistré."); router.refresh();
    }catch(err){setMessage(err instanceof Error?err.message:"Erreur");}
  }
  return <div className="space-y-3">{message&&<p className="text-sm text-slate-500">{message}</p>}{rows.map((r,i)=><div key={r.id} className="grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-8">
    <input className={input+" md:col-span-2"} value={r.name} onChange={(e)=>setRows(rows.map((x,j)=>j===i?{...x,name:e.target.value}:x))}/>
    <input className={input} type="number" value={r.price} onChange={(e)=>setRows(rows.map((x,j)=>j===i?{...x,price:Number(e.target.value)}:x))}/>
    <input className={input} type="number" placeholder="Ancien prix" value={r.compare_at_price} onChange={(e)=>setRows(rows.map((x,j)=>j===i?{...x,compare_at_price:e.target.value}:x))}/>
    <input className={input} type="number" value={r.stock} onChange={(e)=>setRows(rows.map((x,j)=>j===i?{...x,stock:Number(e.target.value)}:x))}/>
    <select className={input} value={r.category_id} onChange={(e)=>setRows(rows.map((x,j)=>j===i?{...x,category_id:e.target.value}:x))}><option value="">Sans catégorie</option>{categories.map((c)=><option key={String(c.id)} value={String(c.id)}>{String(c.name)}</option>)}</select>
    <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={r.is_active} onChange={(e)=>setRows(rows.map((x,j)=>j===i?{...x,is_active:e.target.checked}:x))}/>Actif</label>
    <div className="flex items-center gap-2"><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={r.is_featured} onChange={(e)=>setRows(rows.map((x,j)=>j===i?{...x,is_featured:e.target.checked}:x))}/>★</label><button className="rounded bg-slate-900 px-2 py-1 text-xs font-semibold text-white" onClick={()=>persist(r)}>Sauver</button></div>
  </div>)}</div>;
}

export function CategoryQuickEditor({ storeId, categories }: { storeId:string; categories:Array<Record<string,unknown>> }) {
  const router=useRouter();
  const [rows,setRows]=useState(categories.map((c)=>({id:String(c.id),name:String(c.name??""),slug:String(c.slug??""),is_visible:Boolean(c.is_visible),position:Number(c.position??0)})));
  const [message,setMessage]=useState("");
  async function persist(row:(typeof rows)[number]){try{await save(storeId,{action:"category",category_id:row.id,name:row.name,slug:row.slug,is_visible:row.is_visible,position:row.position});setMessage("Catégorie enregistrée.");router.refresh();}catch(err){setMessage(err instanceof Error?err.message:"Erreur");}}
  return <div className="space-y-3">{message&&<p className="text-sm text-slate-500">{message}</p>}{rows.map((r,i)=><div key={r.id} className="grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-6">
    <input className={input+" md:col-span-2"} value={r.name} onChange={(e)=>setRows(rows.map((x,j)=>j===i?{...x,name:e.target.value}:x))}/>
    <input className={input+" md:col-span-2"} value={r.slug} onChange={(e)=>setRows(rows.map((x,j)=>j===i?{...x,slug:e.target.value}:x))}/>
    <input className={input} type="number" value={r.position} onChange={(e)=>setRows(rows.map((x,j)=>j===i?{...x,position:Number(e.target.value)}:x))}/>
    <div className="flex items-center gap-2"><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={r.is_visible} onChange={(e)=>setRows(rows.map((x,j)=>j===i?{...x,is_visible:e.target.checked}:x))}/>Visible</label><button className="rounded bg-slate-900 px-2 py-1 text-xs font-semibold text-white" onClick={()=>persist(r)}>Sauver</button></div>
  </div>)}</div>;
}

export function IntegrationsEditor({ storeId, shipping, marketing, sheets, telegram }: {storeId:string;shipping:Array<Record<string,unknown>>;marketing:Array<Record<string,unknown>>;sheets:Record<string,unknown>|null;telegram:Record<string,unknown>|null}) {
  const router=useRouter();
  const activeShipping=shipping.find((s)=>s.is_active) ?? shipping[0];
  const [ship,setShip]=useState({provider_key:String(activeShipping?.provider_key??"manual"),api_base_url:"",api_token:"",account:"",is_active:true});
  const [sheet,setSheet]=useState({spreadsheet_id:String(sheets?.spreadsheet_id??""),service_account_json:"",is_active:Boolean(sheets?.is_active)});
  const [tg,setTg]=useState({bot_token:"",chat_id:String(telegram?.chat_id??""),is_active:Boolean(telegram?.is_active)});
  const [pixel,setPixel]=useState({provider_key:"meta_pixel",pixel_id:"",is_active:true});
  const [message,setMessage]=useState("");
  async function run(payload:Record<string,unknown>){setMessage("");try{await save(storeId,payload);setMessage("Configuration enregistrée.");router.refresh();}catch(err){setMessage(err instanceof Error?err.message:"Erreur");}}
  return <div className="space-y-5">{message&&<p className="rounded-lg bg-slate-100 p-3 text-sm">{message}</p>}
    <section className="rounded-xl border p-4"><h4 className="font-bold">Livraison</h4><div className="mt-3 grid gap-2 md:grid-cols-2"><select className={input} value={ship.provider_key} onChange={(e)=>setShip({...ship,provider_key:e.target.value})}>{["manual","navex","yalidine","ecotrack","zr","generic"].map(x=><option key={x} value={x}>{x}</option>)}</select><input className={input} placeholder="API base URL" value={ship.api_base_url} onChange={(e)=>setShip({...ship,api_base_url:e.target.value})}/><input className={input} type="password" placeholder="Token (laisser vide si inchangé)" value={ship.api_token} onChange={(e)=>setShip({...ship,api_token:e.target.value})}/><input className={input} placeholder="Compte / référence" value={ship.account} onChange={(e)=>setShip({...ship,account:e.target.value})}/></div><button className={button+" mt-3"} onClick={()=>run({action:"shipping",...ship})}>Enregistrer livraison</button></section>
    <section className="rounded-xl border p-4"><h4 className="font-bold">Pixel marketing</h4><div className="mt-3 grid gap-2 md:grid-cols-2"><select className={input} value={pixel.provider_key} onChange={(e)=>setPixel({...pixel,provider_key:e.target.value})}>{["meta_pixel","tiktok_pixel","snapchat_pixel","pinterest_tag","ga4","gtm","google_ads"].map(x=><option key={x} value={x}>{x}</option>)}</select><input className={input} placeholder="ID" value={pixel.pixel_id} onChange={(e)=>setPixel({...pixel,pixel_id:e.target.value})}/></div><button className={button+" mt-3"} onClick={()=>run({action:"marketing",...pixel})}>Enregistrer pixel</button></section>
    <section className="rounded-xl border p-4"><h4 className="font-bold">Google Sheets</h4><div className="mt-3 grid gap-2"><input className={input} placeholder="Spreadsheet ID" value={sheet.spreadsheet_id} onChange={(e)=>setSheet({...sheet,spreadsheet_id:e.target.value})}/><textarea className={input} rows={4} placeholder="Service account JSON — laisser vide si inchangé" value={sheet.service_account_json} onChange={(e)=>setSheet({...sheet,service_account_json:e.target.value})}/></div><button className={button+" mt-3"} onClick={()=>run({action:"sheets",...sheet})}>Enregistrer Sheets</button></section>
    <section className="rounded-xl border p-4"><h4 className="font-bold">Telegram</h4><div className="mt-3 grid gap-2 md:grid-cols-2"><input className={input} type="password" placeholder="Bot token — laisser vide si inchangé" value={tg.bot_token} onChange={(e)=>setTg({...tg,bot_token:e.target.value})}/><input className={input} placeholder="Chat ID" value={tg.chat_id} onChange={(e)=>setTg({...tg,chat_id:e.target.value})}/></div><button className={button+" mt-3"} onClick={()=>run({action:"telegram",...tg})}>Enregistrer Telegram</button></section>
    <p className="text-xs text-slate-500">Les secrets sont chiffrés côté serveur. Les endpoints transporteur non documentés restent volontairement désactivés.</p>
    <p className="text-xs text-slate-400">Marketing configuré: {marketing.map((m)=>String(m.provider_key)).join(", ")||"aucun"}</p>
  </div>;
}

export function OwnerEditor({ storeId }: {storeId:string}) {
  const router=useRouter();
  const [form,setForm]=useState({email:"",full_name:"",dashboard_language:"fr"}); const [message,setMessage]=useState("");
  return <form className="grid gap-3 md:grid-cols-2" onSubmit={async(e)=>{e.preventDefault();try{await save(storeId,{action:"owner",...form});setMessage("Compte propriétaire attaché/invité.");router.refresh();}catch(err){setMessage(err instanceof Error?err.message:"Erreur");}}}>
    <label className="text-sm font-medium">Nom complet<input className={input} value={form.full_name} onChange={(e)=>setForm({...form,full_name:e.target.value})}/></label>
    <label className="text-sm font-medium">Email<input className={input} type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/></label>
    <label className="text-sm font-medium">Langue dashboard<select className={input} value={form.dashboard_language} onChange={(e)=>setForm({...form,dashboard_language:e.target.value})}><option value="fr">Français</option><option value="ar">العربية</option><option value="en">English</option></select></label>
    <div className="flex items-end"><button className={button}>Créer / inviter et attacher</button></div>{message&&<p className="md:col-span-2 text-sm text-slate-500">{message}</p>}
  </form>;
}


export function ContentAdminEditor({
  storeId,
  websiteType,
  pages,
  categories,
}: {
  storeId: string;
  websiteType: WebsiteType;
  pages: Array<Record<string, unknown>>;
  categories: Array<Record<string, unknown>>;
}) {
  const editable = pages.filter((p) => p.content && typeof p.content === "object");
  const [pageKey, setPageKey] = useState(String(editable.find((p) => p.key === "home")?.key ?? editable[0]?.key ?? "home"));
  const page = editable.find((p) => String(p.key) === pageKey);
  if (!page) return <p className="text-sm text-slate-400">Aucune page structurée à modifier.</p>;

  const content = (page.content as { sections?: Section[] } | null) ?? { sections: [] };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-700">Page :</span>
        <select className={input} value={pageKey} onChange={(e) => setPageKey(e.target.value)}>
          {editable.map((p) => <option key={String(p.id)} value={String(p.key)}>{String(p.title ?? p.key)}</option>)}
        </select>
      </div>
      <SectionEditor
        key={String(page.id)}
        pageKey={String(page.key)}
        pageTitle={String(page.title ?? page.key)}
        initialContent={{ sections: content.sections ?? [] }}
        websiteType={websiteType}
        categories={categories.map((cat) => ({ id: String(cat.id), name: String(cat.name) }))}
        apiBase={`/api/admin/stores/${storeId}/pages`}
        uploadUrl={`/api/admin/stores/${storeId}/upload`}
      />
    </div>
  );
}


export function DomainControl({ storeId, domains }: { storeId: string; domains: Array<Record<string, unknown>> }) {
  const router = useRouter();
  const [hostname, setHostname] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function request(url: string, method: string, body?: Record<string, unknown>) {
    setBusy(true); setMessage("");
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; detail?: string; error?: { message?: string } | string };
      if (!res.ok || data.ok === false) {
        const m = typeof data.error === "string" ? data.error : data.error?.message;
        throw new Error(m || data.detail || "Opération impossible");
      }
      setMessage(data.detail || "Opération réussie.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erreur");
    } finally { setBusy(false); }
  }

  return <div className="space-y-4">
    <form className="flex flex-wrap gap-2" onSubmit={async(e)=>{e.preventDefault();await request("/api/admin/domains","POST",{store_id:storeId,hostname:hostname.trim().toLowerCase(),is_primary:false});setHostname("");}}>
      <input className={input+" min-w-64 flex-1"} placeholder="www.client.dz" value={hostname} onChange={(e)=>setHostname(e.target.value)} required />
      <button className={button} disabled={busy||!hostname}>Ajouter le domaine</button>
    </form>
    {message&&<p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-600">{message}</p>}
    <div className="space-y-2">
      {domains.length===0&&<p className="text-sm text-slate-400">Aucun domaine personnalisé.</p>}
      {domains.map((d)=><div key={String(d.id)} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3">
        <div><div className="font-mono text-sm">{String(d.hostname)}</div><div className="text-xs text-slate-500">Statut: {String(d.status)}{d.is_primary?" · principal":""}</div></div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded border px-3 py-1.5 text-xs font-semibold" disabled={busy} onClick={()=>request(`/api/admin/domains/${String(d.id)}/verify`,"POST")}>Vérifier DNS</button>
          {d.status==="verified"&&!d.is_primary&&<button className="rounded border px-3 py-1.5 text-xs font-semibold" disabled={busy} onClick={()=>request(`/api/admin/domains/${String(d.id)}`,"PATCH",{is_primary:true})}>Définir principal</button>}
          <button className="rounded border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600" disabled={busy} onClick={()=>{if(window.confirm("Supprimer ce domaine ?")) void request(`/api/admin/domains/${String(d.id)}`,"DELETE");}}>Supprimer</button>
        </div>
      </div>)}
    </div>
    <p className="text-xs text-slate-500">La vérification exige le TXT DNS FlexiGo réel. Un domaine non vérifié ne peut pas devenir principal.</p>
  </div>;
}
