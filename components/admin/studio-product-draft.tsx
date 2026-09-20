"use client";

import { useRef, useState } from "react";

export interface StudioVariantDraft {
  name:string; options_text:string; price:string; sku:string; stock:string;
}
export interface StudioOfferDraft { min_quantity:string; total_price:string; label:string }
export interface StudioOptionGroupDraft {
  key:string; label:string; selection_mode:"single"|"multiple"; display_type:"buttons"|"color_swatch"|"image"|"checkbox"|"dropdown"; values:string;
}
export interface StudioProductDraft {
  name:string; short_description:string; description:string; price:string; compare_price:string; cost:string;
  category:string; stock:string; sku:string; featured:boolean; is_digital:boolean; gallery_mode:"slideshow"|"stacked";
  stock_tracking_mode:"none"|"global"|"variants"; min_order_quantity:string; images:string[];
  variants:StudioVariantDraft[]; offers:StudioOfferDraft[]; option_groups:StudioOptionGroupDraft[];
  related_names:string; cross_sell_names:string;
}

export const EMPTY_STUDIO_PRODUCT:StudioProductDraft={
  name:"",short_description:"",description:"",price:"",compare_price:"",cost:"",category:"",stock:"10",sku:"",
  featured:false,is_digital:false,gallery_mode:"slideshow",stock_tracking_mode:"global",min_order_quantity:"1",images:[],
  variants:[],offers:[],option_groups:[],related_names:"",cross_sell_names:"",
};

function move<T>(list:T[],from:number,to:number){const n=[...list];const [x]=n.splice(from,1);if(x===undefined)return list;n.splice(Math.max(0,Math.min(to,n.length)),0,x);return n;}

export function StudioProductDraftEditor({
  value,onChange,onRemove,onDuplicate,index,
}:{value:StudioProductDraft;onChange:(v:StudioProductDraft)=>void;onRemove:()=>void;onDuplicate:()=>void;index:number}) {
  const [open,setOpen]=useState(index===0);
  const [uploading,setUploading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const fileRef=useRef<HTMLInputElement>(null);
  const input="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100";
  const set=<K extends keyof StudioProductDraft>(k:K,v:StudioProductDraft[K])=>onChange({...value,[k]:v});

  async function upload(){
    const files=Array.from(fileRef.current?.files??[]).slice(0,Math.max(0,12-value.images.length));
    if(!files.length)return;
    setUploading(true);setError(null);
    try{
      const urls:string[]=[];
      for(const file of files){
        const fd=new FormData();fd.append("file",file);fd.append("purpose","product");
        const res=await fetch("/api/admin/upload",{method:"POST",body:fd});
        const data=(await res.json().catch(()=>({}))) as {ok?:boolean;url?:string;error?:{message?:string}|string};
        if(!res.ok||!data.ok||!data.url) throw new Error(typeof data.error==="string"?data.error:(data.error?.message??"Upload impossible"));
        urls.push(data.url);
      }
      set("images",[...value.images,...urls].slice(0,12));
    }catch(e){setError(e instanceof Error?e.message:"Upload impossible");}
    finally{setUploading(false);if(fileRef.current)fileRef.current.value="";}
  }

  return <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <button type="button" onClick={()=>setOpen(!open)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
      <div><div className="text-xs font-bold text-violet-600">PRODUIT {index+1}</div><div className="font-semibold text-slate-900">{value.name||"Nouveau produit"}</div></div>
      <span className="text-slate-400">{open?"−":"+"}</span>
    </button>
    {open&&<div className="space-y-4 border-t border-slate-100 p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <input value={value.name} onChange={e=>set("name",e.target.value)} className={input} placeholder="Nom produit *"/>
        <input value={value.price} onChange={e=>set("price",e.target.value)} className={input} type="number" min="0" placeholder="Prix DA *"/>
        <input value={value.compare_price} onChange={e=>set("compare_price",e.target.value)} className={input} type="number" min="0" placeholder="Prix barré"/>
        <input value={value.cost} onChange={e=>set("cost",e.target.value)} className={input} type="number" min="0" placeholder="Coût produit"/>
        <input value={value.category} onChange={e=>set("category",e.target.value)} className={input} placeholder="Catégorie"/>
        <input value={value.sku} onChange={e=>set("sku",e.target.value)} className={input} placeholder="SKU"/>
        <input value={value.stock} onChange={e=>set("stock",e.target.value)} className={input} type="number" min="0" placeholder="Stock"/>
        <select value={value.stock_tracking_mode} onChange={e=>set("stock_tracking_mode",e.target.value as StudioProductDraft["stock_tracking_mode"])} className={input}><option value="none">Stock non suivi</option><option value="global">Stock global</option><option value="variants">Stock par variantes</option></select>
        <input value={value.min_order_quantity} onChange={e=>set("min_order_quantity",e.target.value)} className={input} type="number" min="1" max="50" placeholder="Quantité minimale"/>
      </div>
      <textarea value={value.short_description} onChange={e=>set("short_description",e.target.value)} className={input} rows={2} placeholder="Brève description"/>
      <textarea value={value.description} onChange={e=>set("description",e.target.value)} className={input} rows={4} placeholder="Description complète"/>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={value.featured} onChange={e=>set("featured",e.target.checked)}/> Mis en avant</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={value.is_digital} onChange={e=>set("is_digital",e.target.checked)}/> Produit digital</label>
        <label className="flex items-center gap-2"><input type="radio" checked={value.gallery_mode==="slideshow"} onChange={()=>set("gallery_mode","slideshow")}/> Photos en diaporama</label>
        <label className="flex items-center gap-2"><input type="radio" checked={value.gallery_mode==="stacked"} onChange={()=>set("gallery_mode","stacked")}/> Photos empilées</label>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
        <div className="text-sm font-bold">Photos produit</div><div className="mt-1 text-xs text-slate-500">La première image est la principale. Jusqu’à 12 images.</div>
        <div className="mt-2 flex flex-wrap items-center gap-2"><input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="text-sm"/><button type="button" onClick={upload} disabled={uploading} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">{uploading?"Upload…":"Ajouter"}</button></div>
        {value.images.length>0&&<div className="mt-3 flex gap-2 overflow-x-auto">{value.images.map((url,i)=><div key={url+i} className="w-24 shrink-0 rounded-lg border bg-white p-1">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={url} alt="" className="h-20 w-full rounded object-cover"/><div className="mt-1 flex justify-between"><button type="button" onClick={()=>set("images",move(value.images,i,i-1))} disabled={i===0} className="text-xs">↑</button><span className="text-[9px] text-slate-400">{i===0?"MAIN":i+1}</span><button type="button" onClick={()=>set("images",move(value.images,i,i+1))} disabled={i===value.images.length-1} className="text-xs">↓</button><button type="button" onClick={()=>set("images",value.images.filter((_,j)=>j!==i))} className="text-xs text-red-500">×</button></div></div>)}</div>}
        {error&&<p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>

      <details className="rounded-xl border border-slate-200 p-3">
        <summary className="cursor-pointer text-sm font-bold">Options client — mono/multi choix</summary>
        <div className="mt-3 space-y-3">{value.option_groups.map((g,gi)=><div key={gi} className="rounded-xl bg-slate-50 p-3">
          <div className="grid gap-2 md:grid-cols-4">
            <input className={input} value={g.key} onChange={e=>set("option_groups",value.option_groups.map((x,i)=>i===gi?{...x,key:e.target.value}:x))} placeholder="Clé: Couleur"/>
            <input className={input} value={g.label} onChange={e=>set("option_groups",value.option_groups.map((x,i)=>i===gi?{...x,label:e.target.value}:x))} placeholder="Libellé"/>
            <select className={input} value={g.selection_mode} onChange={e=>set("option_groups",value.option_groups.map((x,i)=>i===gi?{...x,selection_mode:e.target.value as "single"|"multiple"}:x))}><option value="single">Un choix</option><option value="multiple">Multi-choix</option></select>
            <select className={input} value={g.display_type} onChange={e=>set("option_groups",value.option_groups.map((x,i)=>i===gi?{...x,display_type:e.target.value as StudioOptionGroupDraft["display_type"]}:x))}><option value="buttons">Boutons</option><option value="color_swatch">Couleurs</option><option value="image">Images</option><option value="checkbox">Cases</option><option value="dropdown">Liste</option></select>
          </div>
          <input className={input+" mt-2"} value={g.values} onChange={e=>set("option_groups",value.option_groups.map((x,i)=>i===gi?{...x,values:e.target.value}:x))} placeholder="Valeurs séparées par virgules : Noir, Beige, Bleu"/>
          <button type="button" className="mt-2 text-xs font-semibold text-red-600" onClick={()=>set("option_groups",value.option_groups.filter((_,i)=>i!==gi))}>Supprimer ce groupe</button>
        </div>)}</div>
        <button type="button" className="mt-3 rounded-lg border px-3 py-2 text-xs font-semibold" onClick={()=>set("option_groups",[...value.option_groups,{key:"",label:"",selection_mode:"single",display_type:"buttons",values:""}])}>+ Ajouter un groupe</button>
      </details>

      <details className="rounded-xl border border-slate-200 p-3">
        <summary className="cursor-pointer text-sm font-bold">Variantes</summary>
        <div className="mt-3 space-y-2">{value.variants.map((v,vi)=><div key={vi} className="grid gap-2 md:grid-cols-5">
          <input className={input} value={v.name} onChange={e=>set("variants",value.variants.map((x,i)=>i===vi?{...x,name:e.target.value}:x))} placeholder="Noir / M"/>
          <input className={input} value={v.options_text} onChange={e=>set("variants",value.variants.map((x,i)=>i===vi?{...x,options_text:e.target.value}:x))} placeholder="Couleur: Noir, Taille: M"/>
          <input className={input} value={v.price} onChange={e=>set("variants",value.variants.map((x,i)=>i===vi?{...x,price:e.target.value}:x))} type="number" placeholder="Prix DA"/>
          <input className={input} value={v.sku} onChange={e=>set("variants",value.variants.map((x,i)=>i===vi?{...x,sku:e.target.value}:x))} placeholder="SKU"/>
          <div className="flex gap-1"><input className={input} value={v.stock} onChange={e=>set("variants",value.variants.map((x,i)=>i===vi?{...x,stock:e.target.value}:x))} type="number" placeholder="Stock"/><button type="button" onClick={()=>set("variants",value.variants.filter((_,i)=>i!==vi))} className="text-red-500">×</button></div>
        </div>)}</div>
        <button type="button" className="mt-3 rounded-lg border px-3 py-2 text-xs font-semibold" onClick={()=>set("variants",[...value.variants,{name:"",options_text:"",price:"",sku:"",stock:"0"}])}>+ Variante</button>
      </details>

      <details className="rounded-xl border border-slate-200 p-3">
        <summary className="cursor-pointer text-sm font-bold">Offres quantité</summary>
        <div className="mt-3 space-y-2">{value.offers.map((o,oi)=><div key={oi} className="grid gap-2 md:grid-cols-[100px_160px_1fr_auto]"><input className={input} type="number" min="2" value={o.min_quantity} onChange={e=>set("offers",value.offers.map((x,i)=>i===oi?{...x,min_quantity:e.target.value}:x))}/><input className={input} type="number" min="0" value={o.total_price} onChange={e=>set("offers",value.offers.map((x,i)=>i===oi?{...x,total_price:e.target.value}:x))} placeholder="Total DA"/><input className={input} value={o.label} onChange={e=>set("offers",value.offers.map((x,i)=>i===oi?{...x,label:e.target.value}:x))} placeholder="Pack 2"/><button type="button" className="text-red-500" onClick={()=>set("offers",value.offers.filter((_,i)=>i!==oi))}>×</button></div>)}</div>
        <button type="button" className="mt-3 rounded-lg border px-3 py-2 text-xs font-semibold" onClick={()=>set("offers",[...value.offers,{min_quantity:"2",total_price:"",label:""}])}>+ Offre</button>
      </details>

      <div className="grid gap-3 md:grid-cols-2">
        <div><label className="mb-1 block text-xs font-bold text-slate-600">Produits connexes (noms séparés par virgules)</label><input className={input} value={value.related_names} onChange={e=>set("related_names",e.target.value)} placeholder="Produit A, Produit B"/></div>
        <div><label className="mb-1 block text-xs font-bold text-slate-600">Cross-selling (noms séparés par virgules)</label><input className={input} value={value.cross_sell_names} onChange={e=>set("cross_sell_names",e.target.value)} placeholder="Produit C, Produit D"/></div>
      </div>

      <div className="flex gap-3 border-t pt-3"><button type="button" onClick={onDuplicate} className="text-xs font-bold text-violet-600">Dupliquer</button><button type="button" onClick={onRemove} className="text-xs font-bold text-red-600">Supprimer</button></div>
    </div>}
  </div>;
}
