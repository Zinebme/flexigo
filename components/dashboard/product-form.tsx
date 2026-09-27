"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Field,
  Spinner,
  Switch,
  btnGhost,
  btnSm,
  inputCls,
  selectCls,
} from "@/components/ui";
import { Icon, type IconName } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

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
  createEndpoint?: string;
  editEndpoint?: string;
  uploadEndpoint?: string;
  successHref?: string;
  allowStockEdit?: boolean;
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

// ---------------------------------------------------------------------------
// Presentational helpers (module scope so they never remount the form state)
// ---------------------------------------------------------------------------

const sectionCls = "rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03]";

function Section({
  step,
  icon,
  title,
  description,
  badge,
  actions,
  children,
  collapsible = false,
  defaultOpen = false,
}: {
  step?: number;
  icon?: IconName;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const header = (
    <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
          {step ?? (icon ? <Icon name={icon} size={16} /> : null)}
        </span>
        <div className="min-w-0">
          <h3 className="flex flex-wrap items-center gap-2 text-sm font-bold tracking-tight text-slate-900">
            {title}
            {badge}
          </h3>
          {description ? <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p> : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actions ? (
          <div
            className="flex flex-wrap items-center gap-2"
            // Buttons inside a <summary> would otherwise also toggle the section.
            onClick={collapsible ? (e) => e.preventDefault() : undefined}
          >
            {actions}
          </div>
        ) : null}
        {collapsible ? (
          <Icon name="chevronDown" size={16} className="mt-1.5 text-slate-400 transition group-open:rotate-180" />
        ) : null}
      </div>
    </div>
  );

  if (!collapsible) {
    return (
      <section className={sectionCls}>
        {header}
        <div className="border-t border-slate-100 px-5 py-4">{children}</div>
      </section>
    );
  }
  return (
    <details open={defaultOpen} className={cn(sectionCls, "group")}>
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">{header}</summary>
      <div className="border-t border-slate-100 px-5 py-4">{children}</div>
    </details>
  );
}

function MoneyInput({
  value,
  onChange,
  placeholder,
  required,
  min,
  step = ".01",
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  min?: string;
  step?: string;
  id?: string;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputCls, "fx-num pe-11")}
      />
      <span className="pointer-events-none absolute top-1/2 end-3 -translate-y-1/2 text-xs font-bold text-slate-400">DA</span>
    </div>
  );
}

const fileInputCls =
  "block w-full cursor-pointer text-sm text-slate-500 file:me-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-slate-900 file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800";

export function ProductForm({
  initial,
  categories,
  productChoices = [],
  mode,
  createEndpoint = "/api/dashboard/products",
  editEndpoint,
  uploadEndpoint = "/api/dashboard/upload",
  successHref,
  allowStockEdit = false,
}: Props) {
  const router=useRouter();
  const toast=useToast();
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
  const [uploadProgress,setUploadProgress]=useState<{done:number;total:number}|null>(null);
  const [draggedImageIndex,setDraggedImageIndex]=useState<number|null>(null);
  const [dragOver,setDragOver]=useState(false);
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
    setUploading(target); setUploadProgress({done:0,total:accepted.length}); setError(null);
    try{
      for(const [index,file] of accepted.entries()){
        const fd=new FormData(); fd.append("file",file); fd.append("purpose","product");
        const res=await fetch(uploadEndpoint,{method:"POST",body:fd});
        const data=(await res.json().catch(()=>({}))) as {ok?:boolean;url?:string;error?:{message?:string}|string;warnings?:string[]};
        if(!res.ok||!data.ok||!data.url) throw new Error(typeof data.error==="string"?data.error:(data.error?.message??"Téléversement impossible"));
        if(target==="gallery") setImages(prev=>[...prev,data.url!].slice(0,limit));
        else setLandingImages(prev=>[...prev,data.url!].slice(0,limit));
        setUploadProgress({done:index+1,total:accepted.length});
      }
      toast.success(target==="gallery"?"Photos ajoutées":"Images landing ajoutées",`${accepted.length} fichier(s) téléversé(s).`);
    }catch(e){
      const message=e instanceof Error?e.message:"Téléversement impossible";
      setError(message);
      toast.error("Téléversement impossible",message);
    }
    finally{
      setUploading(null);
      setUploadProgress(null);
      setDragOver(false);
      if(galleryRef.current) galleryRef.current.value="";
      if(landingRef.current) landingRef.current.value="";
    }
  }

  function reorderGallery(from:number,to:number) {
    if(from===to) return;
    setImages((current)=>move(current,from,to));
  }

  function toggleId(list:string[], id:string, setter:(v:string[])=>void) {
    setter(list.includes(id)?list.filter(x=>x!==id):[...list,id]);
  }

  async function submit(e:React.FormEvent) {
    e.preventDefault();
    if(uploading!==null){setError("Attendez que toutes les images soient visibles avant d’enregistrer le produit.");return;}
    setBusy(true); setError(null); setOkMsg(null);
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
      sku,stock:(mode==="create"||allowStockEdit)?(Number.parseInt(stock,10)||0):undefined,low_stock_threshold:Number.parseInt(threshold,10)||0,
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

    const endpoint=mode==="create"?createEndpoint:(editEndpoint??`/api/dashboard/products/${initial.id}`);
    const res=await fetch(endpoint,{
      method:mode==="create"?"POST":"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(parsed),
    });
    const data=(await res.json().catch(()=>({}))) as {ok?:boolean;id?:string;error?:{message?:string}|string};
    setBusy(false);
    if(!res.ok||!data.ok){
      const message=typeof data.error==="string"?data.error:(data.error?.message??"Enregistrement impossible");
      setError(message);
      toast.error("Enregistrement impossible",message);
      return;
    }
    if(mode==="create"&&data.id){
      toast.success("Produit créé",name||undefined);
      router.push(successHref??`/dashboard/produits/${data.id}`);router.refresh();
    }
    else {
      setOkMsg("Produit enregistré.");
      toast.success("Produit enregistré",name||undefined);
      router.refresh();
    }
  }

  const subtleBtn=cn(btnGhost,btnSm,"border border-slate-200 bg-white");
  const choiceRows=productChoices.filter(p=>p.id!==initial.id);
  const priceNum=Number.parseFloat(price);
  const costNum=Number.parseFloat(cost);
  const margin=Number.isFinite(priceNum)&&Number.isFinite(costNum)&&priceNum>0?priceNum-costNum:null;
  const marginPct=margin!=null&&priceNum>0?Math.round((margin/priceNum)*100):null;
  const uploadPct=uploadProgress&&uploadProgress.total>0?Math.round((uploadProgress.done/uploadProgress.total)*100):0;

  return (
    <form onSubmit={submit} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* ------------------------------------------------------------ main -- */}
      <div className="min-w-0 space-y-5">
        <Section step={1} title="Informations générales" description="Identité du produit, URL et textes de vente.">
          <div className="space-y-4">
            <Field label="Nom du produit" required htmlFor="product-name">
              <input
                id="product-name"
                className={cn(inputCls,"text-base font-semibold")}
                value={name}
                onChange={(e)=>setName(e.target.value)}
                required
                maxLength={120}
                placeholder="Ex : Montre connectée AMOLED X2"
              />
            </Field>

            <Field
              label="Slug (URL)"
              htmlFor="product-slug"
              hint={slugTouched?"Utilisé dans l'adresse de la fiche produit.":"Généré automatiquement à partir du nom."}
            >
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <span className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-xs font-medium text-slate-400">/produit/</span>
                  <input
                    id="product-slug"
                    className={cn(inputCls,"fx-num ps-[74px]")}
                    value={shownSlug}
                    onChange={(e)=>{setSlugTouched(true);setSlug(e.target.value)}}
                    placeholder="mon-produit"
                  />
                </div>
                <Button
                  tone="secondary"
                  size="sm"
                  icon="refresh"
                  className="shrink-0"
                  onClick={()=>{setSlugTouched(false);setSlug("");}}
                  title="Régénérer depuis le nom"
                >
                  Auto
                </Button>
              </div>
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Brève description" htmlFor="product-short" hint={`${shortDescription.length}/500`}>
                <textarea
                  id="product-short"
                  className={cn(inputCls,"resize-y")}
                  rows={2}
                  maxLength={500}
                  value={shortDescription}
                  onChange={(e)=>setShortDescription(e.target.value)}
                  placeholder="Résumé visible près du titre…"
                />
              </Field>
              <Field label="Catégorie" htmlFor="product-category" hint="Facultatif — sert à la navigation de la boutique.">
                <select id="product-category" className={selectCls} value={categoryId} onChange={(e)=>setCategoryId(e.target.value)}>
                  <option value="">— Aucune —</option>
                  {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Description complète" htmlFor="product-description" hint={`${description.length}/12 000 caractères`}>
              <textarea
                id="product-description"
                className={cn(inputCls,"resize-y leading-6")}
                rows={7}
                maxLength={12000}
                value={description}
                onChange={(e)=>setDescription(e.target.value)}
                placeholder="Matière, dimensions, conseils d'utilisation, contenu du colis…"
              />
            </Field>
          </div>
        </Section>

        <Section
          step={2}
          title="Photos"
          description="La première image est la photo principale. Glissez-déposez pour réordonner."
          badge={<Badge tone={images.length>0?"blue":"gray"} size="sm">{images.length}/12</Badge>}
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="min-w-0">
              <div
                onDragOver={(event)=>{event.preventDefault();setDragOver(true);}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={(event)=>{event.preventDefault();setDragOver(false);if(uploading===null)void upload(Array.from(event.dataTransfer.files),"gallery");}}
                className={cn(
                  "rounded-xl border-2 border-dashed p-5 text-center transition",
                  dragOver?"border-blue-500 bg-blue-50/70":"border-slate-300 bg-slate-50/60 hover:border-slate-400",
                )}
              >
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
                  <Icon name="upload" size={18} />
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  {uploading==="gallery"&&uploadProgress?`Téléversement ${uploadProgress.done}/${uploadProgress.total}…`:"Glissez vos photos ici"}
                </p>
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                  <Icon name="image" size={15} />
                  Choisir des fichiers
                  <input
                    ref={galleryRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={uploading!==null||images.length>=12}
                    onChange={(event)=>void upload(Array.from(event.target.files??[]),"gallery")}
                  />
                </label>
                <p className="mt-2 text-xs text-slate-500">Jusqu’à 12 images · 6 Mo maximum chacune · JPG, PNG ou WebP</p>
                {uploading==="gallery"&&uploadProgress? (
                  <div className="mx-auto mt-3 h-1.5 max-w-xs overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-blue-600 transition-all" style={{width:`${uploadPct}%`}} />
                  </div>
                ) : null}
              </div>

              {images.length>0? (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {images.map((url,idx)=>(
                    <div
                      key={url+idx}
                      draggable
                      onDragStart={(event)=>{setDraggedImageIndex(idx);event.dataTransfer.effectAllowed="move";}}
                      onDragOver={(event)=>{event.preventDefault();event.stopPropagation();event.dataTransfer.dropEffect="move";}}
                      onDrop={(event)=>{event.preventDefault();event.stopPropagation();if(draggedImageIndex!==null)reorderGallery(draggedImageIndex,idx);setDraggedImageIndex(null);}}
                      onDragEnd={()=>setDraggedImageIndex(null)}
                      className={cn(
                        "cursor-grab rounded-xl border bg-white p-2 transition active:cursor-grabbing",
                        draggedImageIndex===idx?"border-blue-400 opacity-60 ring-2 ring-blue-100":"border-slate-200 hover:border-slate-300",
                      )}
                    >
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="aspect-square w-full rounded-lg bg-slate-50 object-cover"/>
                        {idx===0? (
                          <span className="absolute top-1.5 start-1.5 rounded-md bg-slate-900/85 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase">
                            Principale
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <Icon name="grip" size={11} />
                          #{idx+1}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <button type="button" className={cn(subtleBtn,"px-1.5")} disabled={idx===0} title="Monter" onClick={()=>setImages(move(images,idx,idx-1))}>
                            <Icon name="arrowUp" size={12} />
                          </button>
                          <button type="button" className={cn(subtleBtn,"px-1.5")} disabled={idx===images.length-1} title="Descendre" onClick={()=>setImages(move(images,idx,idx+1))}>
                            <Icon name="arrowDown" size={12} />
                          </button>
                          <button
                            type="button"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
                            title="Retirer cette photo"
                            onClick={()=>setImages(images.filter((_,i)=>i!==idx))}
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-slate-700">Affichage des photos</div>
              <div className="space-y-2">
                {([
                  {value:"slideshow" as GalleryMode,title:"Diaporama",text:"Galerie compacte, recommandé."},
                  {value:"stacked" as GalleryMode,title:"Images à la suite",text:"Style landing page sur mobile."},
                ]).map((option)=>(
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer gap-2.5 rounded-xl border p-3 text-sm transition",
                      galleryMode===option.value?"border-blue-500 bg-blue-50/60 ring-1 ring-blue-500/20":"border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <input
                      type="radio"
                      name="gallery_mode"
                      className="mt-0.5"
                      checked={galleryMode===option.value}
                      onChange={()=>setGalleryMode(option.value)}
                    />
                    <span className="min-w-0">
                      <strong className="block text-slate-800">{option.title}</strong>
                      <small className="mt-0.5 block text-xs leading-5 text-slate-500">{option.text}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section step={3} title="Tarification" description="Les totaux sont toujours recalculés côté serveur.">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Prix de vente" required htmlFor="product-price">
              <MoneyInput id="product-price" value={price} onChange={setPrice} required min=".01" />
            </Field>
            <Field label="Prix barré" htmlFor="product-compare" hint="Affiché barré à côté du prix.">
              <MoneyInput id="product-compare" value={compareAt} onChange={setCompareAt} placeholder="Optionnel" min="0" />
            </Field>
            <Field label="Coût d'achat" htmlFor="product-cost" hint="Sert au calcul de marge.">
              <MoneyInput id="product-cost" value={cost} onChange={setCost} placeholder="Optionnel" min="0" />
            </Field>
          </div>
          {margin!=null&&marginPct!=null? (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Icon name="trendingUp" size={14} className={margin>=0?"text-emerald-500":"text-red-500"} />
              Marge estimée :
              <span className={cn("fx-num font-bold",margin>=0?"text-emerald-700":"text-red-700")}>{margin.toFixed(2)} DA</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{marginPct} %</span>
            </p>
          ) : null}
        </Section>

        <Section
          step={4}
          title="Options et choix du client"
          description="Couleur, taille, accessoires… en choix unique ou multiple."
          collapsible
          defaultOpen={optionGroups.length>0}
          badge={<Badge tone={optionGroups.length>0?"blue":"gray"} size="sm">{optionGroups.length} groupe(s)</Badge>}
          actions={
            <Button tone="secondary" size="sm" icon="plus" onClick={()=>setOptionGroups([...optionGroups,emptyOptionGroup()])}>
              Groupe
            </Button>
          }
        >
          <div className="space-y-3">
            {optionGroups.map((g,gi)=>(
              <div key={gi} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <Field label="Clé">
                    <input className={inputCls} placeholder="Couleur" value={g.key} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,key:e.target.value}:x))}/>
                  </Field>
                  <Field label="Libellé affiché">
                    <input className={inputCls} placeholder="Couleur du produit" value={g.label} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,label:e.target.value}:x))}/>
                  </Field>
                  <Field label="Sélection">
                    <select className={selectCls} value={g.selection_mode} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,selection_mode:e.target.value as SelectionMode,max_selections:e.target.value==="single"?1:x.max_selections}:x))}>
                      <option value="single">Un seul choix</option>
                      <option value="multiple">Choix multiples</option>
                    </select>
                  </Field>
                  <Field label="Affichage">
                    <select className={selectCls} value={g.display_type} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,display_type:e.target.value as DisplayType}:x))}>
                      <option value="buttons">Boutons</option>
                      <option value="color_swatch">Pastilles couleur</option>
                      <option value="image">Images</option>
                      <option value="checkbox">Cases à cocher</option>
                      <option value="dropdown">Liste</option>
                    </select>
                  </Field>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
                  <label className="inline-flex items-center gap-1.5">
                    <input type="checkbox" className="rounded" checked={g.required} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,required:e.target.checked}:x))}/>
                    Choix obligatoire
                  </label>
                  {g.selection_mode==="multiple"? (
                    <>
                      <label className="inline-flex items-center gap-1.5">
                        Min
                        <input type="number" min={0} max={20} className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-xs" value={g.min_selections} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,min_selections:Number(e.target.value)}:x))}/>
                      </label>
                      <label className="inline-flex items-center gap-1.5">
                        Max
                        <input type="number" min={1} max={20} className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-xs" value={g.max_selections} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,max_selections:Number(e.target.value)}:x))}/>
                      </label>
                    </>
                  ) : null}
                </div>

                <div className="mt-3 space-y-2">
                  {g.values.map((v,vi)=>(
                    <div key={vi} className="grid items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 md:grid-cols-[1fr_1fr_64px_1fr_1fr_auto]">
                      <input className={cn(inputCls,"py-1.5")} placeholder="Valeur (ex: Rouge)" value={v.value} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,values:x.values.map((vv,j)=>j===vi?{...vv,value:e.target.value}:vv)}:x))}/>
                      <input className={cn(inputCls,"py-1.5")} placeholder="Libellé" value={v.label} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,values:x.values.map((vv,j)=>j===vi?{...vv,label:e.target.value}:vv)}:x))}/>
                      <label className="flex h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-slate-50" title="Couleur">
                        <input type="color" className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0" value={v.color||"#000000"} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,values:x.values.map((vv,j)=>j===vi?{...vv,color:e.target.value}:vv)}:x))}/>
                      </label>
                      <input className={cn(inputCls,"py-1.5")} placeholder="URL image" value={v.image} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,values:x.values.map((vv,j)=>j===vi?{...vv,image:e.target.value}:vv)}:x))}/>
                      <select className={cn(selectCls,"py-1.5")} value={v.addon_product_id} onChange={e=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,values:x.values.map((vv,j)=>j===vi?{...vv,addon_product_id:e.target.value}:vv)}:x))}>
                        <option value="">Pas d'add-on</option>
                        {choiceRows.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <button
                        type="button"
                        title="Supprimer cette valeur"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
                        onClick={()=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,values:x.values.filter((_,j)=>j!==vi)}:x))}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button tone="secondary" size="sm" icon="plus" onClick={()=>setOptionGroups(optionGroups.map((x,i)=>i===gi?{...x,values:[...x.values,emptyOptionValue()]}:x))}>
                    Valeur
                  </Button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 transition hover:text-red-700"
                    onClick={()=>setOptionGroups(optionGroups.filter((_,i)=>i!==gi))}
                  >
                    <Icon name="trash" size={13} />
                    Supprimer le groupe
                  </button>
                </div>
              </div>
            ))}
            {optionGroups.length===0? (
              <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
                Aucun groupe configuré. Les variantes ci-dessous peuvent aussi générer automatiquement les choix.
              </p>
            ) : null}
          </div>
        </Section>

        <Section
          step={5}
          title="Variantes"
          description="Combinaisons vendables avec prix, SKU et stock propres."
          collapsible
          defaultOpen={variants.length>0}
          badge={<Badge tone={variants.length>0?"blue":"gray"} size="sm">{variants.length}/50</Badge>}
          actions={
            <Button tone="secondary" size="sm" icon="plus" onClick={()=>variants.length<50&&setVariants([...variants,{name:"",options_text:"",price:"",sku:"",stock:"0",is_active:true}])}>
              Variante
            </Button>
          }
        >
          {variants.length===0? (
            <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
              Aucune variante. Ajoutez-en si le produit existe en plusieurs tailles ou couleurs.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="hidden gap-2 px-1 text-[11px] font-bold tracking-wide text-slate-400 uppercase md:grid md:grid-cols-[1fr_1.3fr_110px_110px_90px_auto]">
                <span>Nom</span><span>Options</span><span className="text-right">Prix</span><span>SKU</span><span>Stock</span><span />
              </div>
              {variants.map((v,idx)=>(
                <div key={idx} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 md:grid-cols-[1fr_1.3fr_110px_110px_90px_auto] md:items-center md:bg-white">
                  <input className={cn(inputCls,"py-2")} placeholder="Nom ex : Rouge / M" value={v.name} onChange={e=>setVariants(variants.map((x,i)=>i===idx?{...x,name:e.target.value}:x))}/>
                  <input className={cn(inputCls,"py-2")} placeholder="Couleur: Rouge, Taille: M" value={v.options_text} onChange={e=>setVariants(variants.map((x,i)=>i===idx?{...x,options_text:e.target.value}:x))}/>
                  <MoneyInput value={v.price} onChange={(val)=>setVariants(variants.map((x,i)=>i===idx?{...x,price:val}:x))} min="0"/>
                  <input className={cn(inputCls,"py-2")} placeholder="SKU" value={v.sku} onChange={e=>setVariants(variants.map((x,i)=>i===idx?{...x,sku:e.target.value}:x))}/>
                  <input type="number" min={0} className={cn(inputCls,"fx-num py-2")} placeholder="Stock" value={v.stock} onChange={e=>setVariants(variants.map((x,i)=>i===idx?{...x,stock:e.target.value}:x))}/>
                  <div className="flex items-center justify-between gap-2 md:justify-end">
                    <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500" title="Variante active">
                      <input type="checkbox" checked={v.is_active} onChange={e=>setVariants(variants.map((x,i)=>i===idx?{...x,is_active:e.target.checked}:x))}/>
                      Active
                    </label>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      onClick={()=>setVariants(variants.filter((_,i)=>i!==idx))}
                    >
                      <Icon name="trash" size={13} />
                      Retirer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section
          step={6}
          title="Offres par quantité"
          description="Ex : 2 pièces = 3 900 DA."
          collapsible
          defaultOpen={offers.length>0}
          badge={<Badge tone={offers.length>0?"blue":"gray"} size="sm">{offers.length}/10</Badge>}
          actions={
            <Button tone="secondary" size="sm" icon="plus" onClick={()=>offers.length<10&&setOffers([...offers,{min_quantity:"2",total_price:"",label:""}])}>
              Offre
            </Button>
          }
        >
          {offers.length===0? (
            <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
              Aucune offre. Les paliers de quantité augmentent le panier moyen.
            </p>
          ) : (
            <div className="space-y-2">
              {offers.map((o,idx)=>(
                <div key={idx} className="grid items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 md:grid-cols-[110px_170px_1fr_auto] md:bg-white">
                  <Field label="À partir de">
                    <input type="number" min={2} max={50} className={cn(inputCls,"fx-num py-2")} value={o.min_quantity} onChange={e=>setOffers(offers.map((x,i)=>i===idx?{...x,min_quantity:e.target.value}:x))}/>
                  </Field>
                  <Field label="Prix total">
                    <MoneyInput value={o.total_price} onChange={(val)=>setOffers(offers.map((x,i)=>i===idx?{...x,total_price:val}:x))} min="0"/>
                  </Field>
                  <Field label="Libellé">
                    <input className={cn(inputCls,"py-2")} placeholder="Pack duo" value={o.label} onChange={e=>setOffers(offers.map((x,i)=>i===idx?{...x,label:e.target.value}:x))}/>
                  </Field>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center justify-self-end rounded-lg text-red-500 transition hover:bg-red-50"
                    title="Retirer cette offre"
                    onClick={()=>setOffers(offers.filter((_,i)=>i!==idx))}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section
          step={7}
          title="Images landing"
          description="Images longues affichées dans la fiche produit (style page de vente)."
          collapsible
          defaultOpen={landingImages.length>0}
          badge={<Badge tone={landingImages.length>0?"blue":"gray"} size="sm">{landingImages.length}/20</Badge>}
        >
          <input
            ref={landingRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className={fileInputCls}
            disabled={uploading!==null||landingImages.length>=20}
          />
          <Button
            tone="secondary"
            size="sm"
            className="mt-3"
            icon={uploading==="landing"?undefined:"upload"}
            onClick={()=>upload(Array.from(landingRef.current?.files??[]),"landing")}
            disabled={uploading!==null||landingImages.length>=20}
          >
            {uploading==="landing"?(<><Spinner size={14} /> Téléversement…</>):"Ajouter des images landing"}
          </Button>
          {landingImages.length>0? (
            <div className="fx-scroll mt-3 flex gap-2 overflow-x-auto pb-1">
              {landingImages.map((url,idx)=>(
                <div key={url+idx} className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-24 w-20 rounded-lg border border-slate-200 object-cover"/>
                  <button
                    type="button"
                    className="absolute -top-1.5 -end-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition hover:bg-red-600"
                    title="Retirer cette image"
                    onClick={()=>setLandingImages(landingImages.filter((_,i)=>i!==idx))}
                  >
                    <Icon name="x" size={11} strokeWidth={2.6} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </Section>

        <Section
          step={8}
          title="Produits connexes et cross-selling"
          description="Les connexes s'affichent en bas de fiche ; le cross-selling sert aux suggestions additionnelles."
          collapsible
          defaultOpen={relatedIds.length>0||crossSellIds.length>0}
          badge={
            relatedIds.length+crossSellIds.length>0? (
              <Badge tone="blue" size="sm">{relatedIds.length+crossSellIds.length} lien(s)</Badge>
            ) : undefined
          }
        >
          {choiceRows.length===0? (
            <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
              Créez d&apos;autres produits pour utiliser cette section.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {([
                {title:"Produits connexes",ids:relatedIds,set:setRelatedIds},
                {title:"Cross-selling",ids:crossSellIds,set:setCrossSellIds},
              ]).map((group)=>(
                <div key={group.title}>
                  <div className="mb-2 flex items-center justify-between gap-2 text-sm font-bold text-slate-800">
                    {group.title}
                    <Badge tone={group.ids.length>0?"blue":"gray"} size="sm">{group.ids.length}</Badge>
                  </div>
                  <div className="fx-scroll max-h-52 space-y-1 overflow-auto rounded-xl border border-slate-200 p-2">
                    {choiceRows.map(p=>(
                      <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 transition hover:bg-slate-50">
                        <input type="checkbox" checked={group.ids.includes(p.id)} onChange={()=>toggleId(group.ids,p.id,group.set)}/>
                        <span className="truncate">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section
          step={9}
          title="Ordre des éléments de la page produit"
          description="Contrôle l'ordre d'affichage des blocs sur la fiche."
          collapsible
        >
          <ol className="space-y-2">
            {pageOrder.map((key,idx)=>(
              <li key={key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
                <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-700">
                  <Icon name="grip" size={14} className="text-slate-400" />
                  <span className="fx-num text-xs font-bold text-slate-400">{idx+1}.</span>
                  <span className="truncate">{ORDER_LABELS[key]??key}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <button type="button" className={cn(subtleBtn,"px-2")} disabled={idx===0} title="Monter" onClick={()=>setPageOrder(move(pageOrder,idx,idx-1))}>
                    <Icon name="arrowUp" size={13} />
                  </button>
                  <button type="button" className={cn(subtleBtn,"px-2")} disabled={idx===pageOrder.length-1} title="Descendre" onClick={()=>setPageOrder(move(pageOrder,idx,idx+1))}>
                    <Icon name="arrowDown" size={13} />
                  </button>
                </span>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      {/* ------------------------------------------------------------ rail -- */}
      <aside className="min-w-0 space-y-4 lg:sticky lg:top-20">
        <section className={sectionCls}>
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <Icon name="eye" size={16} className="text-slate-400" />
            <h3 className="text-sm font-bold tracking-tight text-slate-900">Visibilité</h3>
            <Badge tone={isActive?"green":"gray"} dot size="sm" className="ms-auto">{isActive?"En ligne":"Masqué"}</Badge>
          </div>
          <div className="space-y-2 px-5 py-4">
            <Switch checked={isActive} onChange={(e)=>setIsActive(e.target.checked)} label="Visible sur la boutique" description="Sinon, la fiche reste accessible uniquement via l'administration."/>
            <Switch checked={isFeatured} onChange={(e)=>setIsFeatured(e.target.checked)} label="Mis en avant" description="Affiché dans les sections « produits populaires »."/>
            <Switch checked={isDigital} onChange={(e)=>setIsDigital(e.target.checked)} label="Produit digital" description="Aucune livraison ni stock physique."/>
          </div>
        </section>

        <section className={sectionCls}>
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <Icon name="clipboard" size={16} className="text-slate-400" />
            <h3 className="text-sm font-bold tracking-tight text-slate-900">Stock et référence</h3>
          </div>
          <div className="space-y-4 px-5 py-4">
            <Field label="Suivi du stock" htmlFor="product-stock-tracking">
              <select id="product-stock-tracking" className={selectCls} value={stockTracking} onChange={e=>setStockTracking(e.target.value as StockTracking)}>
                <option value="none">Ne pas suivre</option>
                <option value="global">Quantité globale</option>
                <option value="variants">Quantité par variante</option>
              </select>
            </Field>
            <Field label="SKU produit" htmlFor="product-sku">
              <input id="product-sku" className={cn(inputCls,"fx-num")} value={sku} onChange={e=>setSku(e.target.value)} placeholder="Ex : MTL-X2-NOIR"/>
            </Field>
            {(mode==="create"||allowStockEdit)&&stockTracking==="global"? (
              <Field label={mode==="create"?"Quantité initiale":"Quantité en stock"} htmlFor="product-stock"
                hint={mode==="edit"?"Un ajustement justifié est disponible sous ce formulaire.":undefined}>
                <input id="product-stock" type="number" min={0} className={cn(inputCls,"fx-num")} value={stock} onChange={e=>setStock(e.target.value)}/>
              </Field>
            ) : null}
            <Field label="Alerte si stock ≤" htmlFor="product-threshold" hint="Déclenche l'alerte dans le tableau de bord.">
              <input id="product-threshold" type="number" min={0} className={cn(inputCls,"fx-num")} value={threshold} onChange={e=>setThreshold(e.target.value)}/>
            </Field>
          </div>
        </section>

        <section className={sectionCls}>
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <Icon name="sliders" size={16} className="text-slate-400" />
            <h3 className="text-sm font-bold tracking-tight text-slate-900">Options produit</h3>
          </div>
          <div className="space-y-4 px-5 py-4">
            <Field label="Nom sur le bordereau" htmlFor="product-shipping-label" hint="Utilisé par le transporteur.">
              <input id="product-shipping-label" className={inputCls} value={shippingLabel} onChange={e=>setShippingLabel(e.target.value)} placeholder="Optionnel"/>
            </Field>
            <Field label="Quantité minimale" htmlFor="product-min-qty" hint="Par commande (1 à 50).">
              <input id="product-min-qty" type="number" min={1} max={50} className={cn(inputCls,"fx-num")} value={minOrderQuantity} onChange={e=>setMinOrderQuantity(e.target.value)}/>
            </Field>
          </div>
        </section>

        <details className={cn(sectionCls,"group")} open={Boolean(seoTitle||seoDescription)}>
          <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 list-none [&::-webkit-details-marker]:hidden">
            <Icon name="search" size={16} className="text-slate-400" />
            <h3 className="text-sm font-bold tracking-tight text-slate-900">SEO</h3>
            {seoTitle||seoDescription? <Badge tone="green" size="sm" className="ms-1">Renseigné</Badge> : <Badge tone="gray" size="sm" className="ms-1">Vide</Badge>}
            <Icon name="chevronDown" size={16} className="ms-auto text-slate-400 transition group-open:rotate-180" />
          </summary>
          <div className="space-y-4 border-t border-slate-100 px-5 py-4">
            <Field label="Titre SEO" htmlFor="product-seo-title" hint={`${seoTitle.length}/160`}>
              <input id="product-seo-title" className={inputCls} value={seoTitle} onChange={e=>setSeoTitle(e.target.value)} maxLength={160}/>
            </Field>
            <Field label="Description SEO" htmlFor="product-seo-description" hint={`${seoDescription.length}/300`}>
              <textarea id="product-seo-description" className={cn(inputCls,"resize-y")} rows={3} value={seoDescription} onChange={e=>setSeoDescription(e.target.value)} maxLength={300}/>
            </Field>
          </div>
        </details>
      </aside>

      {/* ------------------------------------------------------ action bar -- */}
      <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg shadow-slate-900/10 backdrop-blur lg:col-span-2">
        <Button type="submit" tone="primary" disabled={busy||uploading!==null} icon={busy||uploading!==null?undefined:"check"}>
          {uploading!==null?(<><Spinner size={15} /> Attendez la fin des images…</>)
            :busy?(<><Spinner size={15} /> Enregistrement…</>)
            :mode==="create"?"Créer le produit":"Enregistrer les modifications"}
        </Button>
        <span className="text-xs text-slate-400">
          {mode==="create"?"Le produit est créé visible : pensez à vérifier les photos.":"Les modifications sont appliquées immédiatement sur la boutique."}
        </span>
        {error? <p className="flex items-center gap-1.5 text-sm font-medium text-red-600"><Icon name="alert" size={14} />{error}</p> : null}
        {okMsg&&!error? <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600"><Icon name="checkCircle" size={14} />{okMsg}</p> : null}
      </div>
    </form>
  );
}
