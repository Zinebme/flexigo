"use client";

import { useState } from "react";
import { SectionEditor } from "@/components/dashboard/section-editor";
import { CheckoutSettingsEditor } from "@/components/dashboard/checkout-settings-editor";
import { ProductForm, type ProductFormInitial } from "@/components/dashboard/product-form";
import type { Section } from "@/lib/sections/definitions";
import type { WebsiteType } from "@/lib/types";
import { useRouter } from "next/navigation";
import { WILAYAS } from "@/lib/algeria/wilayas";

const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
const button = "rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50";

async function save(storeId: string, payload: Record<string, unknown>) {
  const res = await fetch(`/api/admin/stores/${storeId}/control`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; owner_account?: "invited" | "attached" | "resent"; access_link?: string; error?: { message?: string } | string };
  if (!res.ok || !data.ok) {
    const message = typeof data.error === "string" ? data.error : data.error?.message;
    throw new Error(message || "Enregistrement impossible");
  }
  return data;
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

export function AdminCheckoutSettingsEditor({ storeId, initial }: { storeId: string; initial: unknown }) {
  const router = useRouter();
  return (
    <CheckoutSettingsEditor
      initial={initial}
      title="Formulaire de commande du client"
      onSave={async (checkout) => {
        await save(storeId, { action: "checkout", checkout });
        router.refresh();
      }}
    />
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

export function AdminProductCreateForm({ storeId, products, categories }: { storeId:string; products:Array<Record<string,unknown>>; categories:Array<Record<string,unknown>> }) {
  return <ProductForm
    mode="create"
    createEndpoint={`/api/admin/stores/${storeId}/products`}
    uploadEndpoint={`/api/admin/stores/${storeId}/upload`}
    successHref={`/admin/sites/${storeId}?tab=products`}
    categories={categories.map((category)=>({id:String(category.id),name:String(category.name)}))}
    productChoices={products.map((product)=>({id:String(product.id),name:String(product.name)}))}
    initial={{
      name:"",slug:"",description:"",short_description:"",price:0,cost:null,is_digital:false,free_shipping:false,
      gallery_mode:"slideshow",landing_images:[],min_order_quantity:1,shipping_label:"",
      stock_tracking_mode:"global",related_product_ids:[],cross_sell_product_ids:[],
      page_element_order:["gallery","title","price","variants","offers","description","order_form","landing","reviews","related"],
      option_groups:[],compare_at_price:null,sku:"",stock:0,low_stock_threshold:5,
      is_active:true,is_featured:false,category_id:null,images:[],seo_title:"",seo_description:"",variants:[],offers:[],
    }}
  />;
}

export function ProductQuickEditor({ storeId, products, categories }: { storeId:string; products:Array<Record<string,unknown>>; categories:Array<Record<string,unknown>> }) {
  const router=useRouter();
  const [editingId,setEditingId]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  function stringArray(value:unknown):string[]{
    return Array.isArray(value)?value.filter((item):item is string=>typeof item==="string"):[];
  }

  function optionsText(value:unknown):string {
    if(!value||typeof value!=="object"||Array.isArray(value)) return "";
    return Object.entries(value as Record<string,unknown>).map(([key,val])=>`${key}: ${String(val)}`).join(", ");
  }

  function toInitial(product:Record<string,unknown>):ProductFormInitial {
    const images=Array.isArray(product.product_images)?[...(product.product_images as Array<Record<string,unknown>>)].sort((a,b)=>Number(a.position??0)-Number(b.position??0)).map((row)=>String(row.url??"")).filter(Boolean):[];
    const variants=Array.isArray(product.product_variants)?[...(product.product_variants as Array<Record<string,unknown>>)].sort((a,b)=>Number(a.position??0)-Number(b.position??0)).map((row)=>({
      id:String(row.id??""),
      name:String(row.name??""),
      options_text:optionsText(row.options),
      price:row.price_cents==null?null:Number(row.price_cents)/100,
      sku:String(row.sku??""),
      stock:Number(row.stock??0),
      is_active:Boolean(row.is_active),
    })):[];
    const offers=Array.isArray(product.quantity_offers)?[...(product.quantity_offers as Array<Record<string,unknown>>)].sort((a,b)=>Number(a.position??0)-Number(b.position??0)).map((row)=>({
      min_quantity:Number(row.min_quantity??2),
      total_price:Number(row.total_price_cents??0)/100,
      label:String(row.label??""),
      free_shipping:Boolean(row.free_shipping),
    })):[];
    return {
      id:String(product.id),
      name:String(product.name??""),
      slug:String(product.slug??""),
      description:String(product.description??""),
      short_description:String(product.short_description??""),
      price:Number(product.price_cents??0)/100,
      compare_at_price:product.compare_at_price_cents==null?null:Number(product.compare_at_price_cents)/100,
      cost:product.cost_cents==null?null:Number(product.cost_cents)/100,
      sku:String(product.sku??""),
      stock:Number(product.stock??0),
      low_stock_threshold:Number(product.low_stock_threshold??5),
      is_active:Boolean(product.is_active),
      is_featured:Boolean(product.is_featured),
      is_digital:Boolean(product.is_digital),
      free_shipping:Boolean(product.free_shipping),
      category_id:product.category_id?String(product.category_id):null,
      images,
      landing_images:stringArray(product.landing_images),
      gallery_mode:product.gallery_mode==="stacked"?"stacked":"slideshow",
      stock_tracking_mode:product.stock_tracking_mode==="none"||product.stock_tracking_mode==="variants"?product.stock_tracking_mode:"global",
      min_order_quantity:Number(product.min_order_quantity??1),
      shipping_label:String(product.shipping_label??""),
      seo_title:String(product.seo_title??""),
      seo_description:String(product.seo_description??""),
      related_product_ids:stringArray(product.related_product_ids),
      cross_sell_product_ids:stringArray(product.cross_sell_product_ids),
      page_element_order:stringArray(product.page_element_order),
      option_groups:(Array.isArray(product.option_groups)?product.option_groups:[]) as ProductFormInitial["option_groups"],
      variants,
      offers,
    };
  }

  async function removeProduct(product:Record<string,unknown>){
    if(!window.confirm(`Supprimer « ${String(product.name??"ce produit")} » de la boutique ?`)) return;
    setBusy(true);setMessage("");
    try{
      await save(storeId,{action:"product_delete",product_id:String(product.id)});
      setMessage("Produit supprimé.");
      if(editingId===String(product.id)) setEditingId(null);
      router.refresh();
    }catch(err){setMessage(err instanceof Error?err.message:"Erreur");}
    finally{setBusy(false);}
  }

  const categoryRows=categories.map((category)=>({id:String(category.id),name:String(category.name)}));
  const productChoices=products.map((product)=>({id:String(product.id),name:String(product.name)}));
  const selected=products.find((product)=>String(product.id)===editingId)??null;

  return <div className="space-y-4">
    {message&&<p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700" role="status">{message}</p>}
    {products.length===0&&<p className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-400">Aucun produit. Ajoutez le premier ci-dessus.</p>}
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product)=>{
        const image=Array.isArray(product.product_images)?[...(product.product_images as Array<Record<string,unknown>>)].sort((a,b)=>Number(a.position??0)-Number(b.position??0))[0]?.url:null;
        const active=Boolean(product.is_active);
        return <div key={String(product.id)} className={`rounded-2xl border p-4 transition ${editingId===String(product.id)?"border-violet-400 ring-2 ring-violet-100":"border-slate-200"}`}>
          <div className="flex gap-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-slate-50">{image?/* eslint-disable-next-line @next/next/no-img-element */<img src={String(image)} alt="" className="h-full w-full object-cover"/>:<div className="flex h-full items-center justify-center text-xl">📦</div>}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold text-slate-900">{String(product.name??"Produit")}</div>
              <div className="mt-1 text-sm font-semibold text-slate-700">{(Number(product.price_cents??0)/100).toLocaleString("fr-DZ")} DA</div>
              <div className="mt-1 flex flex-wrap gap-1 text-[11px]"><span className={active?"rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700":"rounded-full bg-slate-100 px-2 py-0.5 text-slate-500"}>{active?"Visible":"Masqué"}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">Stock {Number(product.stock??0)}</span></div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white" onClick={()=>setEditingId(editingId===String(product.id)?null:String(product.id))}>{editingId===String(product.id)?"Fermer":"Modifier toute la fiche"}</button>
            <button type="button" disabled={busy} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50" onClick={()=>void removeProduct(product)}>Supprimer</button>
          </div>
        </div>;
      })}
    </div>

    {selected&&<div className="rounded-2xl border-2 border-violet-200 bg-violet-50/30 p-4 md:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div><h4 className="text-lg font-bold text-slate-900">Modifier toute la fiche — {String(selected.name??"Produit")}</h4><p className="mt-1 text-sm text-slate-500">Même formulaire complet que lors de la création : photos, variantes, options, offres, stock, produits connexes, ordre de page, SEO et paramètres avancés.</p></div>
        <button type="button" className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold" onClick={()=>setEditingId(null)}>Fermer</button>
      </div>
      <ProductForm
        key={String(selected.id)}
        mode="edit"
        initial={toInitial(selected)}
        editEndpoint={`/api/admin/stores/${storeId}/products/${String(selected.id)}`}
        uploadEndpoint={`/api/admin/stores/${storeId}/upload`}
        successHref={`/admin/sites/${storeId}?tab=products`}
        categories={categoryRows}
        productChoices={productChoices}
        allowStockEdit
      />
    </div>}
  </div>;
}

export function CategoryQuickEditor({ storeId, categories }: { storeId:string; categories:Array<Record<string,unknown>> }) {
  const router=useRouter();
  const makeRows=(items:Array<Record<string,unknown>>)=>items.map((category)=>({
    id:String(category.id),
    name:String(category.name??""),
    slug:String(category.slug??""),
    description:String(category.description??""),
    image_url:String(category.image_url??""),
    is_visible:Boolean(category.is_visible),
    position:Number(category.position??0),
  }));
  const [rows,setRows]=useState(()=>makeRows(categories));
  const [draft,setDraft]=useState({name:"",slug:"",description:"",image_url:"",is_visible:true,position:"0"});
  const [editingId,setEditingId]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);
  const [uploading,setUploading]=useState<string|null>(null);
  const [message,setMessage]=useState("");

  async function uploadImage(file:File,target:"draft"|string){
    setUploading(target);setMessage("");
    try{
      const fd=new FormData();fd.append("file",file);fd.append("purpose","category");
      const res=await fetch(`/api/admin/stores/${storeId}/upload`,{method:"POST",body:fd});
      const data=(await res.json().catch(()=>({}))) as {ok?:boolean;url?:string;error?:{message?:string}|string};
      if(!res.ok||!data.ok||!data.url) throw new Error(typeof data.error==="string"?data.error:(data.error?.message??"Téléversement impossible"));
      if(target==="draft") setDraft((current)=>({...current,image_url:data.url as string}));
      else setRows((current)=>current.map((row)=>row.id===target?{...row,image_url:data.url as string}:row));
    }catch(err){setMessage(err instanceof Error?err.message:"Téléversement impossible");}
    finally{setUploading(null);}
  }

  async function createCategory(event:React.FormEvent){
    event.preventDefault();setBusy(true);setMessage("");
    try{
      await save(storeId,{action:"category_create",name:draft.name,slug:draft.slug||null,description:draft.description||null,image_url:draft.image_url||null,is_visible:draft.is_visible,position:Number(draft.position)});
      setDraft({name:"",slug:"",description:"",image_url:"",is_visible:true,position:"0"});
      setMessage("Catégorie ajoutée.");router.refresh();
    }catch(err){setMessage(err instanceof Error?err.message:"Erreur");}finally{setBusy(false);}
  }
  async function persist(row:(typeof rows)[number]){
    setBusy(true);setMessage("");
    try{
      await save(storeId,{action:"category",category_id:row.id,name:row.name,slug:row.slug,description:row.description||null,image_url:row.image_url||null,is_visible:row.is_visible,position:row.position});
      setMessage("Catégorie enregistrée.");router.refresh();
    }catch(err){setMessage(err instanceof Error?err.message:"Erreur");}finally{setBusy(false);}
  }
  async function removeCategory(row:(typeof rows)[number]){
    if(!window.confirm(`Supprimer la catégorie « ${row.name} » ? Les produits seront conservés sans catégorie.`))return;
    setBusy(true);setMessage("");
    try{await save(storeId,{action:"category_delete",category_id:row.id});setRows((current)=>current.filter((item)=>item.id!==row.id));if(editingId===row.id)setEditingId(null);setMessage("Catégorie supprimée. Les produits ont été conservés.");router.refresh();}
    catch(err){setMessage(err instanceof Error?err.message:"Erreur");}finally{setBusy(false);}
  }

  return <div className="space-y-5">
    <form className="space-y-4 rounded-2xl border border-violet-200 bg-violet-50/50 p-5" onSubmit={createCategory}>
      <div><h4 className="font-bold text-violet-950">Ajouter une catégorie complète</h4><p className="mt-1 text-xs text-violet-700">Nom, URL, description, image, visibilité et ordre d’affichage.</p></div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600">Nom *<input className={input} value={draft.name} onChange={(e)=>setDraft({...draft,name:e.target.value})} required minLength={2}/></label>
        <label className="text-xs font-semibold text-slate-600">Slug / URL<input className={input} value={draft.slug} onChange={(e)=>setDraft({...draft,slug:e.target.value})} placeholder="Généré depuis le nom si vide"/></label>
        <label className="text-xs font-semibold text-slate-600 md:col-span-2">Description<textarea className={input} rows={3} value={draft.description} onChange={(e)=>setDraft({...draft,description:e.target.value})}/></label>
        <div><div className="mb-1 text-xs font-semibold text-slate-600">Image</div><div className="flex items-center gap-3"><input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="text-sm" disabled={uploading!==null} onChange={(e)=>{const file=e.target.files?.[0];if(file)void uploadImage(file,"draft");}}/>{draft.image_url&&/* eslint-disable-next-line @next/next/no-img-element */<img src={draft.image_url} alt="" className="h-12 w-12 rounded-lg border object-cover"/>}</div></div>
        <label className="text-xs font-semibold text-slate-600">Ordre<input className={input} type="number" min="0" value={draft.position} onChange={(e)=>setDraft({...draft,position:e.target.value})}/></label>
      </div>
      <div className="flex flex-wrap items-center gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.is_visible} onChange={(e)=>setDraft({...draft,is_visible:e.target.checked})}/> Visible sur le site</label><button className={button} disabled={busy||uploading!==null}>{busy?"Ajout…":"Ajouter la catégorie"}</button></div>
    </form>

    {message&&<p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700" role="status">{message}</p>}
    {rows.length===0&&<p className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-400">Aucune catégorie.</p>}

    <div className="space-y-3">
      {rows.map((row,index)=>{
        const open=editingId===row.id;
        return <section key={row.id} className={`rounded-2xl border bg-white ${open?"border-violet-300 ring-2 ring-violet-100":"border-slate-200"}`}>
          <button type="button" className="flex w-full items-center justify-between gap-3 p-4 text-left" onClick={()=>setEditingId(open?null:row.id)}>
            <div className="flex min-w-0 items-center gap-3">{row.image_url?/* eslint-disable-next-line @next/next/no-img-element */<img src={row.image_url} alt="" className="h-12 w-12 shrink-0 rounded-xl border object-cover"/>:<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-slate-50">🗂️</div>}<div className="min-w-0"><div className="truncate font-semibold text-slate-900">{row.name}</div><div className="text-xs text-slate-500">/{row.slug} · ordre {row.position}{!row.is_visible?" · masquée":""}</div></div></div>
            <span className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-violet-700">{open?"Fermer":"Modifier"}</span>
          </button>
          {open&&<div className="space-y-4 border-t border-slate-100 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs font-semibold text-slate-600">Nom *<input className={input} value={row.name} onChange={(e)=>setRows(rows.map((item,i)=>i===index?{...item,name:e.target.value}:item))}/></label>
              <label className="text-xs font-semibold text-slate-600">Slug / URL<input className={input} value={row.slug} onChange={(e)=>setRows(rows.map((item,i)=>i===index?{...item,slug:e.target.value}:item))}/></label>
              <label className="text-xs font-semibold text-slate-600 md:col-span-2">Description<textarea className={input} rows={3} value={row.description} onChange={(e)=>setRows(rows.map((item,i)=>i===index?{...item,description:e.target.value}:item))}/></label>
              <div><div className="mb-1 text-xs font-semibold text-slate-600">Image</div><div className="flex items-center gap-3"><input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="text-sm" disabled={uploading!==null} onChange={(e)=>{const file=e.target.files?.[0];if(file)void uploadImage(file,row.id);}}/>{row.image_url&&/* eslint-disable-next-line @next/next/no-img-element */<img src={row.image_url} alt="" className="h-12 w-12 rounded-lg border object-cover"/>}</div></div>
              <label className="text-xs font-semibold text-slate-600">Ordre<input className={input} type="number" min="0" value={row.position} onChange={(e)=>setRows(rows.map((item,i)=>i===index?{...item,position:Number(e.target.value)}:item))}/></label>
            </div>
            <div className="flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={row.is_visible} onChange={(e)=>setRows(rows.map((item,i)=>i===index?{...item,is_visible:e.target.checked}:item))}/> Visible sur le site</label><button type="button" disabled={busy||uploading!==null} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" onClick={()=>void persist(row)}>Enregistrer toute la catégorie</button><button type="button" disabled={busy} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50" onClick={()=>void removeCategory(row)}>Supprimer</button></div>
          </div>}
        </section>;
      })}
    </div>
  </div>;
}

export function IntegrationsEditor({ storeId, shipping, marketing, sheets, telegram }: {storeId:string;shipping:Array<Record<string,unknown>>;marketing:Array<Record<string,unknown>>;sheets:Record<string,unknown>|null;telegram:Record<string,unknown>|null}) {
  const router=useRouter();
  const activeShipping=shipping.find((s)=>s.is_active) ?? shipping[0];
  const manualConfig=shipping.find((s)=>s.provider_key==="manual")?.config as {pickup_offices?: Array<{wilaya_code:number;name:string;address:string}>}|undefined;
  const [offices,setOffices]=useState<Array<{wilaya_code:number;name:string;address:string}>>(() => Array.isArray(manualConfig?.pickup_offices) ? manualConfig.pickup_offices : []);
  const [officesBusy,setOfficesBusy]=useState(false);
  const [ship,setShip]=useState({provider_key:String(activeShipping?.provider_key??"manual"),api_base_url:"",api_token:"",account:"",is_active:false});
  const [sheet,setSheet]=useState({spreadsheet_id:String(sheets?.spreadsheet_id??""),service_account_json:"",is_active:Boolean(sheets?.is_active)});
  const [tg,setTg]=useState({bot_token:"",chat_id:String(telegram?.chat_id??""),is_active:Boolean(telegram?.is_active)});
  const [pixel,setPixel]=useState({provider_key:"meta_pixel",pixel_id:"",is_active:true});
  const [message,setMessage]=useState("");
  async function run(payload:Record<string,unknown>){setMessage("");try{await save(storeId,payload);setMessage("Configuration enregistrée.");router.refresh();}catch(err){setMessage(err instanceof Error?err.message:"Erreur");}}
  return <div className="space-y-5">{message&&<p className="rounded-lg bg-slate-100 p-3 text-sm">{message}</p>}
    <section className="rounded-xl border p-4"><h4 className="font-bold">Livraison manuelle</h4><p className="text-sm text-slate-500">Utilise les tarifs configurés par wilaya. {activeShipping?.provider_key === "manual" ? "Mode actif." : "Mode inactif."}</p><button className={button+" mt-3"} onClick={()=>run({action:"shipping",provider_key:"manual",is_active:true})}>Activer le mode manuel</button></section>
    <section className="rounded-xl border p-4"><h4 className="font-bold">Transporteur API</h4><p className="text-sm text-slate-500">{shipping.filter(sh=>sh.provider_key!=="manual" && sh.provider_key!=="mock").map(sh=>`${sh.provider_key} : ${sh.status}${sh.is_active?" (actif)":""}`).join(" · ")||"Aucune connexion configurée"}</p><div className="mt-3 grid gap-2 md:grid-cols-2"><select className={input} value={ship.provider_key==="manual"?"generic":ship.provider_key} onChange={(e)=>setShip({...ship,provider_key:e.target.value})}>{["navex","yalidine","ecotrack","zr","generic"].map(x=><option key={x} value={x}>{x}</option>)}</select><input className={input} placeholder="API base URL" value={ship.api_base_url} onChange={e=>setShip({...ship,api_base_url:e.target.value})}/><input className={input} type="password" placeholder="Token (laisser vide si inchangé)" value={ship.api_token} onChange={e=>setShip({...ship,api_token:e.target.value})}/><input className={input} placeholder="Compte / référence" value={ship.account} onChange={e=>setShip({...ship,account:e.target.value})}/></div><button className={button+" mt-3"} onClick={()=>run({action:"shipping",...ship,provider_key:ship.provider_key==="manual"?"generic":ship.provider_key})}>Enregistrer la configuration</button><p className="mt-2 text-xs text-amber-700">Les identifiants restent réservés au Super Admin. L’activation de l’envoi automatique nécessite un adaptateur API opérationnel.</p></section>
    <section className="rounded-xl border p-4"><h4 className="font-bold">Bureaux de retrait</h4><p className="mt-1 text-sm text-slate-500">Ajoutez les adresses confirmées par votre transporteur. Si aucun bureau n’est renseigné pour une wilaya, le client peut demander une livraison au bureau ; vous lui communiquerez l’adresse après confirmation.</p>
      <div className="mt-4 space-y-3">{offices.map((office,index)=><div key={index} className="grid items-end gap-2 rounded-lg bg-slate-50 p-3 md:grid-cols-[11rem_1fr_1.5fr_auto]">
        <label className="text-xs font-semibold text-slate-700">Wilaya<select className={input} value={office.wilaya_code} onChange={e=>setOffices(offices.map((row,i)=>i===index?{...row,wilaya_code:Number(e.target.value)}:row))}>{WILAYAS.map(w=><option key={w.code} value={w.code}>{w.code} - {w.name}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-700">Nom du bureau<input className={input} maxLength={40} value={office.name} onChange={e=>setOffices(offices.map((row,i)=>i===index?{...row,name:e.target.value}:row))} placeholder="Bureau centre-ville" /></label>
        <label className="text-xs font-semibold text-slate-700">Adresse vérifiée<input className={input} maxLength={75} value={office.address} onChange={e=>setOffices(offices.map((row,i)=>i===index?{...row,address:e.target.value}:row))} placeholder="Rue, numéro et quartier" /></label>
        <button type="button" className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700" onClick={()=>setOffices(offices.filter((_,i)=>i!==index))}>Supprimer</button>
      </div>)}</div>
      <div className="mt-4 flex flex-wrap gap-2"><button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={()=>setOffices([...offices,{wilaya_code:16,name:"",address:""}])}>+ Ajouter un bureau</button><button type="button" disabled={officesBusy || offices.some(office=>office.name.trim().length<2 || office.address.trim().length<5)} className={button} onClick={async()=>{setOfficesBusy(true);try{await run({action:"shipping_offices",offices:offices.map(o=>({...o,name:o.name.trim(),address:o.address.trim()}))});}finally{setOfficesBusy(false);}}}>Enregistrer les bureaux</button></div>
    </section>
    <section className="rounded-xl border p-4"><h4 className="font-bold">Pixel marketing</h4><div className="mt-3 grid gap-2 md:grid-cols-2"><select className={input} value={pixel.provider_key} onChange={(e)=>setPixel({...pixel,provider_key:e.target.value})}>{["meta_pixel","tiktok_pixel","snapchat_pixel","pinterest_tag","ga4","gtm","google_ads"].map(x=><option key={x} value={x}>{x}</option>)}</select><input className={input} placeholder="ID" value={pixel.pixel_id} onChange={(e)=>setPixel({...pixel,pixel_id:e.target.value})}/></div><button className={button+" mt-3"} onClick={()=>run({action:"marketing",...pixel})}>Enregistrer pixel</button></section>
    <section className="rounded-xl border p-4"><h4 className="font-bold">Google Sheets</h4><div className="mt-3 grid gap-2"><input className={input} placeholder="Spreadsheet ID" value={sheet.spreadsheet_id} onChange={(e)=>setSheet({...sheet,spreadsheet_id:e.target.value})}/><textarea className={input} rows={4} placeholder="Service account JSON — laisser vide si inchangé" value={sheet.service_account_json} onChange={(e)=>setSheet({...sheet,service_account_json:e.target.value})}/></div><button className={button+" mt-3"} onClick={()=>run({action:"sheets",...sheet})}>Enregistrer Sheets</button></section>
    <section className="rounded-xl border p-4"><h4 className="font-bold">Telegram</h4><div className="mt-3 grid gap-2 md:grid-cols-2"><input className={input} type="password" placeholder="Bot token — laisser vide si inchangé" value={tg.bot_token} onChange={(e)=>setTg({...tg,bot_token:e.target.value})}/><input className={input} placeholder="Chat ID" value={tg.chat_id} onChange={(e)=>setTg({...tg,chat_id:e.target.value})}/></div><button className={button+" mt-3"} onClick={()=>run({action:"telegram",...tg})}>Enregistrer Telegram</button></section>
    <p className="text-xs text-slate-500">Les secrets sont chiffrés côté serveur. Les endpoints transporteur non documentés restent volontairement désactivés.</p>
    <p className="text-xs text-slate-400">Marketing configuré: {marketing.map((m)=>String(m.provider_key)).join(", ")||"aucun"}</p>
  </div>;
}

type MemberProfile = { email: string | null; full_name: string | null; dashboard_language: "fr" | "ar" | "en" };

export function OwnerEditor({ storeId, members, profileMap }: {storeId:string;members:Array<Record<string,unknown>>;profileMap:Map<string,MemberProfile>}) {
  const router=useRouter();
  const [form,setForm]=useState({email:"",full_name:"",dashboard_language:"fr"}); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
  const makeRows=()=>members.map((member)=>{
    const profile=profileMap.get(String(member.user_id));
    return {id:String(member.id),user_id:String(member.user_id),email:profile?.email??"",full_name:profile?.full_name??"",dashboard_language:profile?.dashboard_language??"fr",role:String(member.role),status:String(member.status)};
  });
  const [rows,setRows]=useState(makeRows);
  async function updateMember(row:(typeof rows)[number]){setBusy(true);setMessage("");try{await save(storeId,{action:"member_update",member_id:row.id,full_name:row.full_name,dashboard_language:row.dashboard_language,role:row.role});setMessage("Compte client modifié.");router.refresh();}catch(err){setMessage(err instanceof Error?err.message:"Erreur");}finally{setBusy(false);}}
  async function changeStatus(row:(typeof rows)[number]){const next=row.status==="active"?"revoked":"active";setBusy(true);setMessage("");try{await save(storeId,{action:"member_status",member_id:row.id,status:next});setRows((current)=>current.map((item)=>item.id===row.id?{...item,status:next}:item));setMessage(next==="revoked"?"Accès suspendu pour cette boutique.":"Accès réactivé.");router.refresh();}catch(err){setMessage(err instanceof Error?err.message:"Erreur");}finally{setBusy(false);}}
  async function removeMember(row:(typeof rows)[number]){if(!window.confirm(`Retirer ${row.email||"ce compte"} de cette boutique ? Son compte Supabase et ses autres boutiques seront conservés.`))return;setBusy(true);setMessage("");try{await save(storeId,{action:"member_remove",member_id:row.id});setRows((current)=>current.filter((item)=>item.id!==row.id));setMessage("Accès retiré de cette boutique.");router.refresh();}catch(err){setMessage(err instanceof Error?err.message:"Erreur");}finally{setBusy(false);}}
  async function sendAccessEmail(row:(typeof rows)[number]){setBusy(true);setMessage("");try{await save(storeId,{action:"member_send_access_email",member_id:row.id});setMessage(`Email d’accès demandé pour ${row.email}. Vérifiez aussi les spams.`);}catch(err){setMessage(err instanceof Error?err.message:"Erreur");}finally{setBusy(false);}}
  async function copyAccessLink(row:(typeof rows)[number]){setBusy(true);setMessage("");try{const result=await save(storeId,{action:"member_access_link",member_id:row.id});if(!result.access_link)throw new Error("Lien indisponible");await navigator.clipboard.writeText(result.access_link);setMessage("Lien d’accès copié. Envoyez-le directement au marchand.");}catch(err){setMessage(err instanceof Error?err.message:"Erreur");}finally{setBusy(false);}}
  return <div className="space-y-5">
    <div className="space-y-3">
      {rows.length===0&&<p className="rounded-xl border border-dashed p-5 text-center text-sm text-slate-400">Aucun compte marchand attaché.</p>}
      {rows.map((row,index)=><div key={row.id} className="rounded-xl border border-slate-200 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><div className="font-semibold text-slate-900">{row.email||row.user_id}</div><div className="text-xs text-slate-400">L’email ne se modifie pas ici : retirez puis invitez la nouvelle adresse.</div></div><span className={`rounded-full px-2 py-1 text-xs font-bold ${row.status==="active"?"bg-emerald-100 text-emerald-700":"bg-slate-100 text-slate-500"}`}>{row.status==="active"?"Actif":"Suspendu"}</span></div>
        <div className="grid gap-2 md:grid-cols-3">
          <label className="text-xs font-semibold text-slate-600">Nom complet<input className={input} value={row.full_name} onChange={(e)=>setRows(rows.map((item,i)=>i===index?{...item,full_name:e.target.value}:item))}/></label>
          <label className="text-xs font-semibold text-slate-600">Rôle<select className={input} value={row.role} onChange={(e)=>setRows(rows.map((item,i)=>i===index?{...item,role:e.target.value}:item))}><option value="OWNER">Propriétaire</option><option value="MANAGER">Manager</option><option value="ORDER_MANAGER">Commandes</option><option value="CONTENT_EDITOR">Contenu</option><option value="VIEWER">Lecture seule</option></select></label>
          <label className="text-xs font-semibold text-slate-600">Langue<select className={input} value={row.dashboard_language} onChange={(e)=>setRows(rows.map((item,i)=>i===index?{...item,dashboard_language:e.target.value as "fr"|"ar"|"en"}:item))}><option value="fr">Français</option><option value="ar">العربية</option><option value="en">English</option></select></label>
        </div>
        <div className="mt-3 flex flex-wrap justify-end gap-2"><button type="button" disabled={busy} className="rounded border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 disabled:opacity-50" onClick={()=>void sendAccessEmail(row)}>Renvoyer l’email d’accès</button><button type="button" disabled={busy} className="rounded border border-violet-200 px-3 py-1.5 text-xs font-semibold text-violet-700 disabled:opacity-50" onClick={()=>void copyAccessLink(row)}>Copier le lien d’accès</button><button type="button" disabled={busy} className="rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" onClick={()=>void updateMember(row)}>Enregistrer</button><button type="button" disabled={busy} className="rounded border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 disabled:opacity-50" onClick={()=>void changeStatus(row)}>{row.status==="active"?"Suspendre":"Réactiver"}</button><button type="button" disabled={busy} className="rounded border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-50" onClick={()=>void removeMember(row)}>Retirer</button></div>
      </div>)}
    </div>
    <form className="grid gap-3 border-t pt-5 md:grid-cols-2" onSubmit={async(e)=>{e.preventDefault();setBusy(true);setMessage("");try{const result=await save(storeId,{action:"owner",...form});setForm({email:"",full_name:"",dashboard_language:"fr"});setMessage(result.owner_account==="invited"?"Invitation envoyée au nouveau propriétaire.":result.owner_account==="resent"?"Compte existant attaché et email d’accès renvoyé.":"Compte Marqova existant attaché à cette boutique.");router.refresh();}catch(err){setMessage(err instanceof Error?err.message:"Erreur");}finally{setBusy(false);}}}>
      <h4 className="font-bold text-slate-900 md:col-span-2">Ajouter une personne</h4>
      <label className="text-sm font-medium">Nom complet <span className="font-normal text-slate-400">(facultatif)</span><input className={input} value={form.full_name} onChange={(e)=>setForm({...form,full_name:e.target.value})}/></label>
      <label className="text-sm font-medium">Email<input className={input} type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} required/></label>
      <label className="text-sm font-medium">Langue dashboard<select className={input} value={form.dashboard_language} onChange={(e)=>setForm({...form,dashboard_language:e.target.value})}><option value="fr">Français</option><option value="ar">العربية</option><option value="en">English</option></select></label>
      <div className="flex items-end"><button className={button} disabled={busy}>{busy?"Invitation…":"Créer / inviter et attacher"}</button></div>
    </form>
    {message&&<p className="text-sm text-slate-600" role="status">{message}</p>}
  </div>;
}


type CustomerDraft = {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  status: "active" | "suspended";
  order_count: number;
  total_spent_cents: number;
};

export function CustomerAdminEditor({ storeId, customers }: { storeId: string; customers: Array<Record<string, unknown>> }) {
  const router = useRouter();
  const [rows, setRows] = useState<CustomerDraft[]>(() => customers.map((customer) => ({
    id: String(customer.id),
    name: String(customer.name ?? ""),
    phone: String(customer.phone ?? ""),
    email: String(customer.email ?? ""),
    notes: String(customer.notes ?? ""),
    status: customer.status === "suspended" ? "suspended" : "active",
    order_count: Number(customer.order_count ?? 0),
    total_spent_cents: Number(customer.total_spent_cents ?? 0),
  })));
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  function patchRow(id: string, patch: Partial<CustomerDraft>) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row));
  }

  async function createCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyId("create");
    setMessage("");
    try {
      await save(storeId, { action: "customer_create", ...form });
      setForm({ name: "", phone: "", email: "", notes: "" });
      setMessage("Client ajouté.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  async function updateCustomer(row: CustomerDraft) {
    setBusyId(row.id);
    setMessage("");
    try {
      await save(storeId, {
        action: "customer_update",
        customer_id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        notes: row.notes,
      });
      setMessage("Client modifié.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleCustomer(row: CustomerDraft) {
    const status = row.status === "active" ? "suspended" : "active";
    setBusyId(row.id);
    setMessage("");
    try {
      await save(storeId, { action: "customer_status", customer_id: row.id, status });
      patchRow(row.id, { status });
      setMessage(status === "suspended" ? "Client suspendu : les nouvelles commandes avec ce numéro sont bloquées." : "Client réactivé.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteCustomer(row: CustomerDraft) {
    if (!window.confirm(`Supprimer le client ${row.name} ? Son historique de commandes sera conservé.`)) return;
    setBusyId(row.id);
    setMessage("");
    try {
      await save(storeId, { action: "customer_delete", customer_id: row.id });
      setRows((current) => current.filter((customer) => customer.id !== row.id));
      setMessage("Client supprimé de la liste. Ses commandes restent conservées.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  return <div className="space-y-5">
    <form className="grid gap-3 rounded-xl border border-violet-100 bg-violet-50/40 p-4 md:grid-cols-2" onSubmit={createCustomer}>
      <div className="md:col-span-2">
        <h4 className="font-bold text-slate-900">Ajouter un client acheteur</h4>
        <p className="text-xs text-slate-500">Le numéro algérien est normalisé pour éviter les doublons.</p>
      </div>
      <label className="text-sm font-medium">Nom<input className={input} value={form.name} onChange={(event)=>setForm({...form,name:event.target.value})} required minLength={2}/></label>
      <label className="text-sm font-medium">Téléphone<input className={input} value={form.phone} onChange={(event)=>setForm({...form,phone:event.target.value})} required placeholder="0550 00 00 00"/></label>
      <label className="text-sm font-medium">Email <span className="font-normal text-slate-400">(facultatif)</span><input className={input} type="email" value={form.email} onChange={(event)=>setForm({...form,email:event.target.value})}/></label>
      <label className="text-sm font-medium">Notes <span className="font-normal text-slate-400">(facultatif)</span><input className={input} value={form.notes} onChange={(event)=>setForm({...form,notes:event.target.value})}/></label>
      <div className="md:col-span-2"><button className={button} disabled={busyId==="create"}>{busyId==="create"?"Ajout…":"Ajouter le client"}</button></div>
    </form>

    {message&&<p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700" role="status">{message}</p>}

    <div className="space-y-3">
      {rows.length===0&&<p className="text-sm text-slate-400">Aucun client acheteur pour cette boutique.</p>}
      {rows.map((row)=><div key={row.id} className="rounded-xl border p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-500">{row.order_count} commande(s) · {(row.total_spent_cents / 100).toLocaleString("fr-DZ")} DA dépensés</div>
          <span className={row.status==="active"?"rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700":"rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700"}>{row.status==="active"?"Actif":"Suspendu"}</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-medium">Nom<input className={input} value={row.name} onChange={(event)=>patchRow(row.id,{name:event.target.value})}/></label>
          <label className="text-xs font-medium">Téléphone<input className={input} value={row.phone} onChange={(event)=>patchRow(row.id,{phone:event.target.value})}/></label>
          <label className="text-xs font-medium">Email<input className={input} type="email" value={row.email} onChange={(event)=>patchRow(row.id,{email:event.target.value})}/></label>
          <label className="text-xs font-medium">Notes<input className={input} value={row.notes} onChange={(event)=>patchRow(row.id,{notes:event.target.value})}/></label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="rounded border border-violet-300 px-3 py-1.5 text-xs font-semibold text-violet-700 disabled:opacity-50" disabled={busyId===row.id} onClick={()=>void updateCustomer(row)}>Enregistrer</button>
          <button type="button" className="rounded border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 disabled:opacity-50" disabled={busyId===row.id} onClick={()=>void toggleCustomer(row)}>{row.status==="active"?"Suspendre":"Réactiver"}</button>
          <button type="button" className="rounded border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-50" disabled={busyId===row.id} onClick={()=>void deleteCustomer(row)}>Supprimer</button>
        </div>
      </div>)}
    </div>
  </div>;
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
    <p className="text-xs text-slate-500">La vérification exige l’enregistrement TXT DNS Marqova indiqué. Un domaine non vérifié ne peut pas devenir principal.</p>
  </div>;
}
