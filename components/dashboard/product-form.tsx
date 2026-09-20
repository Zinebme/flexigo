"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SelectionMode = "single" | "multiple";
type DisplayType = "buttons" | "color_swatch" | "image" | "checkbox" | "dropdown";
type GalleryMode = "slideshow" | "stacked";
type StockTracking = "none" | "global" | "variants";

interface OptionValueDraft {
  value: string;
  label: string;
  color: string;
  image: string;
  addon_product_id: string;
}
interface OptionGroupDraft {
  key: string;
  label: string;
  selection_mode: SelectionMode;
  display_type: DisplayType;
  required: boolean;
  min_selections: number;
  max_selections: number;
  values: OptionValueDraft[];
}

export interface ProductFormInitial {
  id?: string;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  price: number;
  compare_at_price: number | null;
  cost?: number | null;
  sku: string;
  stock?: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_featured: boolean;
  is_digital?: boolean;
  category_id: string | null;
  images: string[];
  landing_images?: string[];
  gallery_mode?: GalleryMode;
  stock_tracking_mode?: StockTracking;
  min_order_quantity?: number;
  shipping_label?: string;
  seo_title: string;
  seo_description: string;
  related_product_ids?: string[];
  cross_sell_product_ids?: string[];
  page_element_order?: string[];
  option_groups?: OptionGroupDraft[];
  variants: Array<{ id?: string; name: string; options_text: string; price: number | null; sku?: string; stock: number; is_active: boolean }>;
  offers: Array<{ min_quantity: number; total_price: number; label: string }>;
}

interface Props {
  initial: ProductFormInitial;
  categories: Array<{ id: string; name: string }>;
  productChoices?: Array<{ id: string; name: string }>;
  mode: "create" | "edit";
}
interface VariantDraft {
  id?: string;
  name: string;
  options_text: string;
  price: string;
  sku: string;
  stock: string;
  is_active: boolean;
}
interface OfferDraft { min_quantity: string; total_price: string; label: string }

const DEFAULT_ORDER = ["gallery","title","price","variants","offers","description","order_form","landing","reviews","related"];
const ORDER_LABELS: Record<string,string> = {
  gallery:"Photos", title:"Titre", price:"Prix", variants:"Variantes/options", offers:"Offres",
  description:"Description", order_form:"Formulaire COD", landing:"Landing images", reviews:"Avis", related:"Produits connexes",
};

function move<T>(list:T[], from:number, to:number) {
  const next=[...list];
  const [item]=next.splice(from,1);
  if(item===undefined) return list;
  next.splice(Math.max(0,Math.min(to,next.length)),0,item);
  return next;
}
function parseOptionText(text:string) {
  const options:Record<string,string>={};
  for(const part of text.split(",")){
    const [k,...rest]=part.split(":");
    if(k?.trim() && rest.length) options[k.trim()]=rest.join(":").trim();
  }
  return options;
}
function emptyOptionGroup():OptionGroupDraft {
  return { key:"",label:"",selection_mode:"single",display_type:"buttons",required:true,min_selections:1,max_selections:1,values:[] };
}
function emptyOptionValue():OptionValueDraft {
  return { value:"",label:"",color:"",image:"",addon_product_id:"" };
}

export function ProductForm({ initial, categories, productChoices = [], mode }: Props) {
  const router=useRouter();
  const [name,setName]=useState(initial.name);
  const [slug,setSlug]=useState(initial.slug);
  const [slugTouched,setSlugTouched]=useState(mode==="edit");
  const [shortDescription,setShortDescription]=useState(initial.short_description??"");
  const [description,setDescription]=useState(initial.description);
  const [price,setPrice]=useState(String(initial.price||""));
  const [compareAt,setCompareAt]=useState(initial.compare_at_price!=null?String(initial.compare_at_price):"");
  const [cost,setCost]=useState(initial.cost!=null?String(initial.cost):"");
  const [sku,setSku]=useState(initial.sku);
  const [stock,setStock]=useState(String(initial.stock??0));
  const [threshold,setThreshold]=useState(String(initial.low_stock_threshold));
  const [stockTracking,setStockTracking]=useState<StockTracking>(initial.stock_tracking_mode??"global");
  const [isActive,setIsActive]=useState(initial.is_active);
  const [isFeatured,setIsFeatured]=useState(initial.is_featured);
  const [isDigital,setIsDigital]=useState(initial.is_digital??false);
  const [categoryId,setCategoryId]=useState(initial.category_id??"");
  const [seoTitle,setSeoTitle]=useState(initial.seo_title);
  const [seoDescription,setSeoDescription]=useState(initial.seo_description);
  const [images,setImages]=useState<string[]>(initial.images);
  const [landingImages,setLandingImages]=useState<string[]>(initial.landing_images??[]);
  const [galleryMode,setGalleryMode]=useState<GalleryMode>(initial.gallery_mode??"slideshow");
  const [minOrderQuantity,setMinOrderQuantity]=useState(String(initial.min_order_quantity??1));
  const [shippingLabel,setShippingLabel]=useState(initial.shipping_label??"");
  const [relatedIds,setRelatedIds]=useState<string[]>(initial.related_product_ids??[]);
  const [crossSellIds,setCrossSellIds]=useState<string[]>(initial.cross_sell_product_ids??[]);
  const [pageOrder,setPageOrder]=useState<string[]>(initial.page_element_order?.length?initial.page_element_order:DEFAULT_ORDER);
  const [optionGroups,setOptionGroups]=useState<OptionGroupDraft[]>(initial.option_groups??[]);
  const [variants,setVariants]=useState<VariantDraft[]>(
    initial.variants.map(v=>({id:v.id,name:v.name,options_text:v.options_text,price:v.price!=null?String(v.price):"",sku:v.sku??"",stock:String(v.stock),is_active:v.is_active}))
  );
  const [offers,setOffers]=useState<OfferDraft[]>(
    initial.offers.map(o=>({min_quantity:String(o.min_quantity),total_price:String(o.total_price),label:o.label}))
  );

  const [uploading,setUploading]=useState<"gallery"|"landing"|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [okMsg,setOkMsg]=useState<string|null>(null);
  const galleryRef=useRef<HTMLInputElement>(null);
  const landingRef=useRef<HTMLInputElement>(null);

  const slugSuggestion=useMemo(()=>name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,80),[name]);
  const shownSlug=slugTouched?slug:slugSuggestion;

  async function upload(files:File[], target:"gallery"|"landing") {
    const limit=target==="gallery"?12:20;
    const current=target==="gallery"?images:landingImages;
    const accepted=files.slice(0,Math.max(0,limit-current.length));
    if(!accepted.length) return;
    setUploading(target); setError(null);
    try{
      const collected:string[]=[];
      for(const file of accepted){
        const fd=new FormData(); fd.append("file",file); fd.append("purpose","product");
        const res=await fetch("/api/dashboard/upload",{method:"POST",body:fd});
        const data=(await res.json().catch(()=>({}))) as {ok?:boolean;url?:string;error?:{message?:string}|string;warnings?:string[]};
        if(!res.ok||!data.ok||!data.url) throw new Error(typeof data.error==="string"?data.error:(data.error?.message??"Téléversement impossible"));
        collected.push(data.url);
      }
      if(target==="gallery") setImages(prev=>[...prev,...collected].slice(0,limit));
      else setLandingImages(prev=>[...prev,...collected].slice(0,limit));
    }catch(e){setError(e instanceof Error?e.message:"Téléversement impossible");}
    finally{
      setUploading(null);
      if(galleryRef.current) galleryRef.current.value="";
      if(landingRef.current) landingRef.current.value="";
    }
  }

  function toggleId(list:string[], id:string, setter:(v:string[])=>void) {
    setter(list.includes(id)?list.filter(x=>x!==id):[...list,id]);
  }

  async function submit(e:React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null); setOkMsg(null);
    const cleanGroups=optionGroups
      .filter(g=>g.key.trim()&&g.label.trim())
      .map((g,index)=>({
        key:g.key.trim(),
        option_key:g.key.trim(),
        label:g.label.trim(),
        selection_mode:g.selection_mode,
        display_type:g.display_type,
        required:g.required,
        min_selections:g.selection_mode==="multiple"?Math.max(0,g.min_selections):1,
        max_selections:g.selection_mode==="multiple"?Math.max(1,g.max_selections):1,
        position:index,
        values:g.values.filter(v=>v.value.trim()).map(v=>({
          value:v.value.trim(), label:v.label.trim()||null, color:v.color.trim()||null,
          image:v.image.trim()||null, addon_product_id:v.addon_product_id||null,
        })),
      }));
    const parsed:Record<string,unknown>={
      name,slug:shownSlug,short_description:shortDescription,description,
      price:Number.parseFloat(price),compare_at_price:compareAt?Number.parseFloat(compareAt):null,cost:cost?Number.parseFloat(cost):null,
      sku,stock:mode==="create"?(Number.parseInt(stock,10)||0):undefined,low_stock_threshold:Number.parseInt(threshold,10)||0,
      stock_tracking_mode:stockTracking,is_active:isActive,is_featured:isFeatured,is_digital:isDigital,category_id:categoryId||null,
      images,landing_images:landingImages,gallery_mode:galleryMode,min_order_quantity:Number.parseInt(minOrderQuantity,10)||1,
      shipping_label:shippingLabel,related_product_ids:relatedIds,cross_sell_product_ids:crossSellIds,page_element_order:pageOrder,
      option_groups:cleanGroups,seo_title:seoTitle,seo_description:seoDescription,
      variants:variants.filter(v=>v.name.trim()).map(v=>({
        name:v.name.trim(),options:parseOptionText(v.options_text),price_cents:v.price?Math.round(Number.parseFloat(v.price)*100):null,
        sku:v.sku.trim()||null,stock:Number.parseInt(v.stock,10)||0,is_active:v.is_active,
      })),
    };
    const cleanOffers=offers.filter(o=>o.min_quantity&&o.total_price).map(o=>({
      min_quantity:Number.parseInt(o.min_quantity,10),total_price_cents:Math.round(Number.parseFloat(o.total_price)*100),
      label:o.label.trim()||null,is_active:true,
    }));
    parsed.offers=cleanOffers;
    if(mode==="edit"&&initial.id) parsed.remove_variant_ids=initial.variants.filter(v=>!variants.some(x=>x.id===v.id)).map(v=>v.id).filter(Boolean);

    const res=await fetch(mode==="create"?"/api/dashboard/products":`/api/dashboard/products/${initial.id}`,{
      method:mode==="create"?"POST":"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(parsed),
    });
    const data=(await res.json().catch(()=>({}))) as {ok?:boolean;id?:string;error?:{message?:string}|string};
    setBusy(false);
    if(!res.ok||!data.ok){setError(typeof data.error==="string"?data.error:(data.error?.message??"Enregistrement impossible"));return;}
    if(mode==="create"&&data.id){router.push(`/dashboard/produits/${data.id}`);router.refresh();}
    else {setOkMsg("Produit enregistré.");router.refresh();}
  }

  const label="mb-1.5 block text-sm font-semibold text-slate-700";
  const input="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";
  const section="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const subtleBtn="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50";
  const choiceRows=productChoices.filter(p=>p.id!==initial.id);

  return <form onSubmit={submit} className="space-y-5">
    <section className={section}>
      <div className="mb-5"><h3 className="text-base font-bold text-slate-900">Général</h3><p className="mt-1 text-xs text-slate-500">Identité, descriptions, visibilité et type de produit.</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2"><label className={label}>Nom du produit *</label><input className={input} value={name} onChange={e=>setName(e.target.value)} required maxLength={120}/></div>
        <div><label className={label}>Slug (URL)</label><input className={input} value={shownSlug} onChange={e=>{setSlugTouched(true);setSlug(e.target.value)}}/></div>
        <div><label className={label}>Catégorie</label><select className={input} value={categoryId} onChange={e=>setCategoryId(e.target.value)}><option value="">— Aucune —</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="md:col-span-2"><label className={label}>Brève description</label><textarea className={input} rows={2} maxLength={500} value={shortDescription} onChange={e=>setShortDescription(e.target.value)} placeholder="Résumé visible près du titre…"/></div>
        <div className="md:col-span-2"><label className={label}>Description complète</label><textarea className={input} rows={7} maxLength={12000} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description détaillée du produit…"/></div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={isDigital} onChange={e=>setIsDigital(e.target.checked)}/> Produit digital</label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={isActive} onChange={e=>setIsActive(e.target.checked)}/> Visible sur la boutique</label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={isFeatured} onChange={e=>setIsFeatured(e.target.checked)}/> Mis en avant</label>
      </div>
    </section>

    <section className={section}>
      <div className="mb-4"><h3 className="text-base font-bold text-slate-900">Photos & ordre d'affichage</h3><p className="mt-1 text-xs text-slate-500">La première image est la photo principale. Réordonnez sans réupload.</p></div>
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div>
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5">
            <input ref={galleryRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="block w-full text-sm"/>
            <button type="button" className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={()=>upload(Array.from(galleryRef.current?.files??[]),"gallery")} disabled={uploading!==null||images.length>=12}>{uploading==="gallery"?"Téléversement…":"Ajouter les photos"}</button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((url,idx)=><div key={url+idx} className="rounded-xl border border-slate-200 bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}<img src={url} alt="" className="aspect-square w-full rounded-lg object-cover"/>
              <div className="mt-2 flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-slate-500">{idx===0?"PRINCIPALE":`#${idx+1}`}</span>
                <div className="flex gap-1"><button type="button" className={subtleBtn} disabled={idx===0} onClick={()=>setImages(move(images,idx,idx-1))}>↑</button><button type="button" className={subtleBtn} disabled={idx===images.length-1} onClick={()=>setImages(move(images,idx,idx+1))}>↓</button><button type="button" className="rounded-lg px-2 py-1 text-xs font-bold text-red-500 hover:bg-red-50" onClick={()=>setImages(images.filter((_,i)=>i!==idx))}>×</button></div>
              </div>
            </div>)}
          </div>
        </div>
        <div>
          <label className={label}>Affichage des photos</label>
          <label className="mb-2 flex gap-2 rounded-xl border p-3 text-sm"><input type="radio" checked={galleryMode==="slideshow"} onChange={()=>setGalleryMode("slideshow")}/><span><strong>Diaporama</strong><small className="block text-slate-500">Galerie compacte, recommandé.</small></span></label>
          <label className="flex gap-2 rounded-xl border p-3 text-sm"><input type="radio" checked={galleryMode==="stacked"} onChange={()=>setGalleryMode("stacked")}/><span><strong>Images l'une après l'autre</strong><small className="block text-slate-500">Style landing page sur mobile.</small></span></label>
        </div>
      </div>
    </section>

    <section className={section}>
      <div className="mb-4"><h3 className="text-base font-bold text-slate-900">Landing images (optionnel)</h3><p className="mt-1 text-xs text-slate-500">Images longues affichées dans la fiche produit après le formulaire/description selon l'ordre choisi.</p></div>
      <input ref={landingRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="block w-full text-sm"/>
      <button type="button" className="mt-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={()=>upload(Array.from(landingRef.current?.files??[]),"landing")} disabled={uploading!==null||landingImages.length>=20}>{uploading==="landing"?"Téléversement…":"Ajouter des images landing"}</button>
      {landingImages.length>0&&<div className="mt-3 flex gap-2 overflow-x-auto">{landingImages.map((url,idx)=><div key={url+idx} className="relative shrink-0">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={url} alt="" className="h-24 w-20 rounded-lg border object-cover"/><button type="button" className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white" onClick={()=>setLandingImages(landingImages.filter((_,i)=>i!==idx))}>×</button></div>)}</div>}
    </section>

    <section className={section}>
      <div className="mb-4"><h3 className="text-base font-bold text-slate-900">Tarification</h3></div>
      <div className="grid gap-4 md:grid-cols-3">
        <div><label className={label}>Prix (DA) *</label><input type="number" min=".01" step=".01" className={input} value={price} onChange={e=>setPrice(e.target.value)} required/></div>
        <div><label className={label}>Prix de comparaison</label><input type="number" min="0" step=".01" className={input} value={compareAt} onChange={e=>setCompareAt(e.target.value)} placeholder="Optionnel"/></div>
        <div><label className={label}>Coût produit</label><input type="number" min="0" step=".01" className={input} value={cost} onChange={e=>setCost(e.target.value)} placeholder="Pour calcul bénéfice"/></div>
      </div>
    </section>

    <section className={section}>
      <div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="text-base font-bold text-slate-900">Options / choix client</h3><p className="mt-1 text-xs text-slate-500">Créez Couleur, Taille, Accessoires… et choisissez mono-choix ou multi-choix.</p></div><button type="button" className={subtleBtn} onClick={()=>setOptionGroups([...optionGroups,emptyOptionGroup()])}>+ Groupe</button></div>
      <div className="space-y-3">
        {optionGroups.map((g,gi)=><div key={gi} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input className={input} placeholder="Clé ex: Couleur" value={g.key} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,key:e.target.value}:x))}/>
            <input className={input} placeholder="Libellé affiché" value={g.label} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,label:e.target.value}:x))}/>
            <select className={input} value={g.selection_mode} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,selection_mode:e.target.value as SelectionMode,max_selections:e.target.value==="single"?1:x.max_selections}:x))}><option value="single">Un seul choix</option><option value="multiple">Choix multiples</option></select>
            <select className={input} value={g.display_type} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,display_type:e.target.value as DisplayType}:x))}><option value="buttons">Boutons</option><option value="color_swatch">Pastilles couleur</option><option value="image">Images</option><option value="checkbox">Cases à cocher</option><option value="dropdown">Liste</option></select>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs"><label><input type="checkbox" checked={g.required} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,required:e.target.checked}:x))}/> Obligatoire</label>{g.selection_mode==="multiple"&&<><label>Min <input type="number" min="0" max="20" className="ml-1 w-16 rounded border px-2 py-1" value={g.min_selections} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,min_selections:Number(e.target.value)}:x))}/></label><label>Max <input type="number" min="1" max="20" className="ml-1 w-16 rounded border px-2 py-1" value={g.max_selections} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,max_selections:Number(e.target.value)}:x))}/></label></>}</div>
          <div className="mt-3 space-y-2">
            {g.values.map((v,vi)=><div key={vi} className="grid gap-2 md:grid-cols-[1fr_1fr_100px_1fr_1fr_auto]">
              <input className="rounded-lg border px-2 py-1.5 text-sm" placeholder="Valeur" value={v.value} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,values:x.values.map((vv,j)=>j===vi?{...vv,value:e.target.value}:vv)}:x))}/>
              <input className="rounded-lg border px-2 py-1.5 text-sm" placeholder="Libellé" value={v.label} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,values:x.values.map((vv,j)=>j===vi?{...vv,label:e.target.value}:vv)}:x))}/>
              <input type="color" className="h-9 w-full rounded border" value={v.color||"#000000"} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,values:x.values.map((vv,j)=>j===vi?{...vv,color:e.target.value}:vv)}:x))}/>
              <input className="rounded-lg border px-2 py-1.5 text-sm" placeholder="URL image" value={v.image} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,values:x.values.map((vv,j)=>j===vi?{...vv,image:e.target.value}:vv)}:x))}/>
              <select className="rounded-lg border px-2 py-1.5 text-sm" value={v.addon_product_id} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,values:x.values.map((vv,j)=>j===vi?{...vv,addon_product_id:e.target.value}:vv)}:x))}><option value="">Pas d'add-on</option>{choiceRows.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
              <button type="button" className="text-red-500" onClick={()=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,values:x.values.filter((_,j)=>j!==vi)}:x))}>×</button>
            </div>)}
          </div>
          <div className="mt-3 flex gap-2"><button type="button" className={subtleBtn} onClick={()=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,values:[...x.values,emptyOptionValue()]}:x))}>+ Valeur</button><button type="button" className="text-xs font-semibold text-red-600" onClick={()=>setOptionGroups(optionGroups.filter((_,i)=>i!==gi))}>Supprimer le groupe</button></div>
        </div>)}
        {optionGroups.length===0&&<p className="text-sm text-slate-400">Aucun groupe configuré. Les variantes ci-dessous peuvent aussi générer automatiquement les choix.</p>}
      </div>
    </section>

    <section className={section}>
      <div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="text-base font-bold text-slate-900">Variantes</h3><p className="mt-1 text-xs text-slate-500">Combinaisons vendables avec prix, SKU et stock propres.</p></div><button type="button" className={subtleBtn} onClick={()=>variants.length<50&&setVariants([...variants,{name:"",options_text:"",price:"",sku:"",stock:"0",is_active:true}])}>+ Variante</button></div>
      <div className="space-y-2">{variants.map((v,idx)=><div key={idx} className="grid gap-2 rounded-xl border bg-slate-50 p-3 md:grid-cols-[1fr_1.3fr_110px_110px_90px_auto]">
        <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Nom ex: Rouge / M" value={v.name} onChange={e=>setVariants(variants.map((x,i)=>i===idx?{...x,name:e.target.value}:x))}/>
        <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Couleur: Rouge, Taille: M" value={v.options_text} onChange={e=>setVariants(variants.map((x,i)=>i===idx?{...x,options_text:e.target.value}:x))}/>
        <input type="number" className="rounded-lg border px-3 py-2 text-sm" placeholder="Prix DA" value={v.price} onChange={e=>setVariants(variants.map((x,i)=>i===idx?{...x,price:e.target.value}:x))}/>
        <input className="rounded-lg border px-3 py-2 text-sm" placeholder="SKU" value={v.sku} onChange={e=>setVariants(variants.map((x,i)=>i===idx?{...x,sku:e.target.value}:x))}/>
        <input type="number" min="0" className="rounded-lg border px-3 py-2 text-sm" placeholder="Stock" value={v.stock} onChange={e=>setVariants(variants.map((x,i)=>i===idx?{...x,stock:e.target.value}:x))}/>
        <button type="button" className="text-sm font-semibold text-red-500" onClick={()=>setVariants(variants.filter((_,i)=>i!==idx))}>Retirer</button>
      </div>)}</div>
    </section>

    <section className={section}>
      <div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="text-base font-bold text-slate-900">Offres</h3><p className="mt-1 text-xs text-slate-500">Ex : 2 pièces = 3 900 DA.</p></div><button type="button" className={subtleBtn} onClick={()=>offers.length<10&&setOffers([...offers,{min_quantity:"2",total_price:"",label:""}])}>+ Offre</button></div>
      <div className="space-y-2">{offers.map((o,idx)=><div key={idx} className="grid gap-2 rounded-xl border bg-slate-50 p-3 md:grid-cols-[100px_160px_1fr_auto]">
        <input type="number" min="2" max="50" className="rounded-lg border px-3 py-2 text-sm" value={o.min_quantity} onChange={e=>setOffers(offers.map((x,i)=>i===idx?{...x,min_quantity:e.target.value}:x))}/>
        <input type="number" min="0" step=".01" className="rounded-lg border px-3 py-2 text-sm" placeholder="Total DA" value={o.total_price} onChange={e=>setOffers(offers.map((x,i)=>i===idx?{...x,total_price:e.target.value}:x))}/>
        <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Libellé" value={o.label} onChange={e=>setOffers(offers.map((x,i)=>i===idx?{...x,label:e.target.value}:x))}/>
        <button type="button" className="text-sm font-semibold text-red-500" onClick={()=>setOffers(offers.filter((_,i)=>i!==idx))}>Retirer</button>
      </div>)}</div>
    </section>

    <section className={section}>
      <div className="mb-4"><h3 className="text-base font-bold text-slate-900">Stock & référence</h3></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div><label className={label}>Suivi du stock</label><select className={input} value={stockTracking} onChange={e=>setStockTracking(e.target.value as StockTracking)}><option value="none">Ne pas suivre</option><option value="global">Quantité globale</option><option value="variants">Quantité par variantes</option></select></div>
        <div><label className={label}>SKU produit</label><input className={input} value={sku} onChange={e=>setSku(e.target.value)}/></div>
        {mode==="create"&&stockTracking==="global"&&<div><label className={label}>Quantité initiale</label><input type="number" min="0" className={input} value={stock} onChange={e=>setStock(e.target.value)}/></div>}
        <div><label className={label}>Alerte stock faible</label><input type="number" min="0" className={input} value={threshold} onChange={e=>setThreshold(e.target.value)}/></div>
      </div>
    </section>

    <section className={section}>
      <div className="mb-4"><h3 className="text-base font-bold text-slate-900">Produits connexes & cross-selling</h3><p className="mt-1 text-xs text-slate-500">Les produits connexes sont affichés dans la fiche. Le cross-selling sert aux suggestions additionnelles.</p></div>
      {choiceRows.length===0?<p className="text-sm text-slate-400">Créez d'autres produits pour utiliser cette section.</p>:<div className="grid gap-4 md:grid-cols-2">
        <div><div className="mb-2 text-sm font-bold">Produits connexes</div><div className="max-h-52 space-y-1 overflow-auto rounded-xl border p-2">{choiceRows.map(p=><label key={p.id} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50"><input type="checkbox" checked={relatedIds.includes(p.id)} onChange={()=>toggleId(relatedIds,p.id,setRelatedIds)}/>{p.name}</label>)}</div></div>
        <div><div className="mb-2 text-sm font-bold">Cross-selling</div><div className="max-h-52 space-y-1 overflow-auto rounded-xl border p-2">{choiceRows.map(p=><label key={p.id} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50"><input type="checkbox" checked={crossSellIds.includes(p.id)} onChange={()=>toggleId(crossSellIds,p.id,setCrossSellIds)}/>{p.name}</label>)}</div></div>
      </div>}
    </section>

    <section className={section}>
      <div className="mb-4"><h3 className="text-base font-bold text-slate-900">Options produit</h3></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div><label className={label}>Nom sur bordereau livraison</label><input className={input} value={shippingLabel} onChange={e=>setShippingLabel(e.target.value)} placeholder="Optionnel"/></div>
        <div><label className={label}>Quantité minimale par commande</label><input type="number" min="1" max="50" className={input} value={minOrderQuantity} onChange={e=>setMinOrderQuantity(e.target.value)}/></div>
      </div>
      <div className="mt-5"><div className="mb-2 text-sm font-bold">Ordre des éléments dans la page produit</div><div className="space-y-2">{pageOrder.map((key,idx)=><div key={key} className="flex items-center justify-between rounded-xl border bg-slate-50 px-3 py-2"><span className="text-sm font-medium">{ORDER_LABELS[key]??key}</span><div className="flex gap-1"><button type="button" className={subtleBtn} disabled={idx===0} onClick={()=>setPageOrder(move(pageOrder,idx,idx-1))}>↑</button><button type="button" className={subtleBtn} disabled={idx===pageOrder.length-1} onClick={()=>setPageOrder(move(pageOrder,idx,idx+1))}>↓</button></div></div>)}</div></div>
    </section>

    <section className={section}>
      <div className="mb-4"><h3 className="text-base font-bold text-slate-900">SEO</h3></div>
      <div className="grid gap-4 md:grid-cols-2"><div><label className={label}>Titre SEO</label><input className={input} value={seoTitle} onChange={e=>setSeoTitle(e.target.value)} maxLength={160}/></div><div><label className={label}>Description SEO</label><textarea className={input} rows={2} value={seoDescription} onChange={e=>setSeoDescription(e.target.value)} maxLength={300}/></div></div>
    </section>

    <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
      <button type="submit" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50" disabled={busy}>{busy?"Enregistrement…":mode==="create"?"Créer le produit":"Enregistrer les modifications"}</button>
      {error&&<p className="text-sm text-red-600">{error}</p>}{okMsg&&<p className="text-sm text-emerald-600">{okMsg}</p>}
    </div>
  </form>;
}
