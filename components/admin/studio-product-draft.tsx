"use client";

import { useRef, useState } from "react";

export interface StudioVariantDraft {
  name:string; options_text:string; price:string; sku:string; stock:string;
}
export interface StudioOfferDraft { min_quantity:string; total_price:string; label:string; free_shipping:boolean }
export interface StudioOptionGroupDraft {
  key:string; label:string; selection_mode:"single"|"multiple"; display_type:"buttons"|"color_swatch"|"image"|"checkbox"|"dropdown"; values:string; selection_count_mode:"fixed"|"order_quantity"; min_selections:number; max_selections:number;
}
export interface StudioProductDraft {
  name:string; short_description:string; description:string; price:string; compare_price:string; cost:string;
  category:string; free_shipping:boolean; stock:string; sku:string; featured:boolean; is_digital:boolean; gallery_mode:"slideshow"|"stacked";
  stock_tracking_mode:"none"|"global"|"variants"; min_order_quantity:string; images:string[];
  variants:StudioVariantDraft[]; offers:StudioOfferDraft[]; option_groups:StudioOptionGroupDraft[];
  related_names:string; cross_sell_names:string;
}

export const EMPTY_STUDIO_PRODUCT:StudioProductDraft={
  name:"",short_description:"",description:"",price:"",compare_price:"",cost:"",category:"",stock:"10",sku:"",
  featured:false,is_digital:false,free_shipping:false,gallery_mode:"slideshow",stock_tracking_mode:"global",min_order_quantity:"1",images:[],
  variants:[],offers:[],option_groups:[],related_names:"",cross_sell_names:"",
};

function move<T>(list:T[],from:number,to:number){const n=[...list];const [x]=n.splice(from,1);if(x===undefined)return list;n.splice(Math.max(0,Math.min(to,n.length)),0,x);return n;}

export function StudioProductDraftEditor({
  value,onChange,onRemove,onDuplicate,onUploadingChange,index,categories,productNames,
}:{value:StudioProductDraft;onChange:(v:StudioProductDraft)=>void;onRemove:()=>void;onDuplicate:()=>void;onUploadingChange?:(uploading:boolean)=>void;index:number;categories:string[];productNames:string[]}) {
  const [open,setOpen]=useState(index===0);
  const [uploading,setUploading]=useState(false);
  const [draggedImageIndex,setDraggedImageIndex]=useState<number|null>(null);
  const [error,setError]=useState<string|null>(null);
  const fileRef=useRef<HTMLInputElement>(null);
  const input="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100";
  const set=<K extends keyof StudioProductDraft>(k:K,v:StudioProductDraft[K])=>onChange({...value,[k]:v});

  async function upload(selectedFiles:File[]){
    const files=selectedFiles.slice(0,Math.max(0,12-value.images.length));
    if(!files.length)return;
    setUploading(true);onUploadingChange?.(true);setError(null);
    try{
      const urls:string[]=[];
      for(const file of files){
        const fd=new FormData();fd.append("file",file);fd.append("purpose","product");
        const res=await fetch("/api/admin/upload",{method:"POST",body:fd});
        const data=(await res.json().catch(()=>({}))) as {ok?:boolean;url?:string;error?:{message?:string}|string};
        if(!res.ok||!data.ok||!data.url) throw new Error(typeof data.error==="string"?data.error:(data.error?.message??"Upload impossible"));
        urls.push(data.url);
        onChange({...value,images:[...value.images,...urls].slice(0,12)});
      }
    }catch(e){setError(e instanceof Error?e.message:"Upload impossible");}
    finally{setUploading(false);onUploadingChange?.(false);if(fileRef.current)fileRef.current.value="";}
  }

  return <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <button type="button" onClick={()=>setOpen(!open)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
      <div className="flex min-w-0 items-center gap-3">
        {value.images[0]?<img src={value.images[0]} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover"/>:<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">📦</div>}
        <div className="min-w-0"><div className="text-xs font-bold text-violet-600">PRODUIT {index+1} · {value.images.length} photo(s)</div><div className="truncate font-semibold text-slate-900">{value.name||"Nouveau produit"}</div></div>
      </div>
      <span className="text-slate-400">{open?"−":"+"}</span>
    </button>
    {open&&<div className="space-y-4 border-t border-slate-100 p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <input value={value.name} onChange={e=>set("name",e.target.value)} className={input} placeholder="Nom produit *"/>
        <input value={value.price} onChange={e=>set("price",e.target.value)} className={input} type="number" min="0" placeholder="Prix DA *"/>
        <input value={value.compare_price} onChange={e=>set("compare_price",e.target.value)} className={input} type="number" min="0" placeholder="Prix barré"/>
        <input value={value.cost} onChange={e=>set("cost",e.target.value)} className={input} type="number" min="0" placeholder="Coût produit"/>
        <select value={value.category} onChange={e=>set("category",e.target.value)} className={input}><option value="">Choisir une catégorie *</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select>
        <input value={value.sku} onChange={e=>set("sku",e.target.value)} className={input} placeholder="SKU"/>
        <input value={value.stock} onChange={e=>set("stock",e.target.value)} className={input} type="number" min="0" placeholder="Stock"/>
        <select value={value.stock_tracking_mode} onChange={e=>set("stock_tracking_mode",e.target.value as StudioProductDraft["stock_tracking_mode"])} className={input}><option value="none">Stock non suivi</option><option value="global">Stock global</option><option value="variants">Stock par variantes</option></select>
        <input value={value.min_order_quantity} onChange={e=>set("min_order_quantity",e.target.value)} className={input} type="number" min="1" max="50" placeholder="Quantité minimale"/>
      </div>
      <textarea value={value.short_description} onChange={e=>set("short_description",e.target.value)} className={input} rows={2} placeholder="Brève description"/>
      <textarea value={value.description} onChange={e=>set("description",e.target.value)} className={input} rows={4} placeholder="Description complète"/>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={value.featured} onChange={e=>set("featured",e.target.checked)}/> Mis en avant</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={value.free_shipping} onChange={e=>set("free_shipping",e.target.checked)}/> Livraison gratuite pour ce produit</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={value.is_digital} onChange={e=>set("is_digital",e.target.checked)}/> Produit digital</label>
        <label className="flex items-center gap-2"><input type="radio" checked={value.gallery_mode==="slideshow"} onChange={()=>set("gallery_mode","slideshow")}/> Photos en diaporama</label>
        <label className="flex items-center gap-2"><input type="radio" checked={value.gallery_mode==="stacked"} onChange={()=>set("gallery_mode","stacked")}/> Photos empilées</label>
      </div>

      <div
        className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 transition hover:border-violet-400"
        onDragOver={(event)=>event.preventDefault()}
        onDrop={(event)=>{event.preventDefault();if(!uploading)void upload(Array.from(event.dataTransfer.files));}}
      >
        <div className="text-sm font-bold">Photos produit</div><div className="mt-1 text-xs text-slate-500">La première image est la principale. Sélectionnez ou déposez jusqu’à 12 images (6 Mo maximum chacune), puis glissez les aperçus pour les réorganiser.</div>
        <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="mt-2 text-sm" disabled={uploading||value.images.length>=12} onChange={(event)=>void upload(Array.from(event.target.files??[]))}/>
        {uploading&&<p className="mt-2 text-xs font-semibold text-violet-700">Téléversement en cours…</p>}
        {value.images.length>0&&<div className="mt-3 flex gap-2 overflow-x-auto">{value.images.map((url,i)=><div
          key={url+i}
          draggable
          onDragStart={(event)=>{setDraggedImageIndex(i);event.dataTransfer.effectAllowed="move";}}
          onDragOver={(event)=>{event.preventDefault();event.stopPropagation();event.dataTransfer.dropEffect="move";}}
          onDrop={(event)=>{event.preventDefault();event.stopPropagation();if(draggedImageIndex!==null&&draggedImageIndex!==i)set("images",move(value.images,draggedImageIndex,i));setDraggedImageIndex(null);}}
          onDragEnd={()=>setDraggedImageIndex(null)}
          className={`w-24 shrink-0 cursor-grab rounded-lg border bg-white p-1 transition active:cursor-grabbing ${draggedImageIndex===i?"border-violet-400 opacity-60 ring-2 ring-violet-100":"border-slate-200"}`}
        >{/* eslint-disable-next-line @next/next/no-img-element */}<img src={url} alt="" className="h-20 w-full rounded object-cover"/><div className="mt-1 flex justify-between"><button type="button" onClick={()=>set("images",move(value.images,i,i-1))} disabled={i===0} className="text-xs">↑</button><span className="text-[9px] text-slate-400">{i===0?"MAIN":i+1}</span><button type="button" onClick={()=>set("images",move(value.images,i,i+1))} disabled={i===value.images.length-1} className="text-xs">↓</button><button type="button" onClick={()=>set("images",value.images.filter((_,j)=>j!==i))} className="text-xs text-red-500">×</button></div></div>)}</div>}
        {error&&<p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>

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
        <summary className="cursor-pointer text-sm font-bold">Options client — mono/multi choix</summary>
        <div className="mt-3 space-y-3">{value.option_groups.map((g,gi)=><div key={gi} className="rounded-xl bg-slate-50 p-3">
          <div className="grid gap-2 md:grid-cols-4">
            <input className={input} value={g.key} onChange={e=>set("option_groups",value.option_groups.map((x,i)=>i===gi?{...x,key:e.target.value}:x))} placeholder="Clé: Couleur"/>
            <input className={input} value={g.label} onChange={e=>set("option_groups",value.option_groups.map((x,i)=>i===gi?{...x,label:e.target.value}:x))} placeholder="Libellé"/>
            <select className={input} value={g.selection_mode} onChange={e=>set("option_groups",value.option_groups.map((x,i)=>i===gi?{...x,selection_mode:e.target.value as "single"|"multiple"}:x))}><option value="single">Un choix</option><option value="multiple">Multi-choix</option></select>
            <select className={input} value={g.display_type} onChange={e=>set("option_groups",value.option_groups.map((x,i)=>i===gi?{...x,display_type:e.target.value as StudioOptionGroupDraft["display_type"]}:x))}><option value="buttons">Boutons</option><option value="color_swatch">Couleurs</option><option value="image">Images</option><option value="checkbox">Cases</option><option value="dropdown">Liste</option></select>
          </div>
          {g.selection_mode==="multiple"&&<div className="mt-2 grid gap-2 md:grid-cols-3"><select className={input} value={g.selection_count_mode} onChange={e=>set("option_groups",value.option_groups.map((x,i)=>i===gi?{...x,selection_count_mode:e.target.value as "fixed"|"order_quantity"}:x))}><option value="fixed">Nombre fixe</option><option value="order_quantity">Exactement la quantité commandée (offre 3 = 3 choix)</option></select>{g.selection_count_mode!=="order_quantity"&&<><input type="number" min="0" className={input} value={g.min_selections} onChange={e=>set("option_groups",value.option_groups.map((x,i)=>i===gi?{...x,min_selections:Number(e.target.value)}:x))} placeholder="Minimum"/><input type="number" min="1" className={input} value={g.max_selections} onChange={e=>set("option_groups",value.option_groups.map((x,i)=>i===gi?{...x,max_selections:Number(e.target.value)}:x))} placeholder="Maximum"/></>}</div>}
          <input className={input+" mt-2"} value={g.values} onChange={e=>set("option_groups",value.option_groups.map((x,i)=>i===gi?{...x,values:e.target.value}:x))} placeholder="Valeurs séparées par virgules : Noir, Beige, Bleu"/>
          <button type="button" className="mt-2 text-xs font-semibold text-red-600" onClick={()=>set("option_groups",value.option_groups.filter((_,i)=>i!==gi))}>Supprimer ce groupe</button>
        </div>)}</div>
        <button type="button" className="mt-3 rounded-lg border px-3 py-2 text-xs font-semibold" onClick={()=>set("option_groups",[...value.option_groups,{key:"",label:"",selection_mode:"single",display_type:"buttons",values:"",selection_count_mode:"fixed",min_selections:1,max_selections:1}])}>+ Ajouter un groupe</button>
      </details>

      <details className="rounded-xl border border-slate-200 p-3">
        <summary className="cursor-pointer text-sm font-bold">Offres quantité</summary>
        <div className="mt-3 space-y-2">{value.offers.map((o,oi)=><div key={oi} className="grid gap-2 md:grid-cols-[100px_160px_1fr_auto]"><input className={input} type="number" min="2" value={o.min_quantity} onChange={e=>set("offers",value.offers.map((x,i)=>i===oi?{...x,min_quantity:e.target.value}:x))}/><input className={input} type="number" min="0" value={o.total_price} onChange={e=>set("offers",value.offers.map((x,i)=>i===oi?{...x,total_price:e.target.value}:x))} placeholder="Total DA"/><input className={input} value={o.label} onChange={e=>set("offers",value.offers.map((x,i)=>i===oi?{...x,label:e.target.value}:x))} placeholder="Pack 2"/><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={o.free_shipping} onChange={e=>set("offers",value.offers.map((x,i)=>i===oi?{...x,free_shipping:e.target.checked}:x))}/> Livraison offerte</label><button type="button" className="text-red-500" onClick={()=>set("offers",value.offers.filter((_,i)=>i!==oi))}>×</button></div>)}</div>
        <button type="button" className="mt-3 rounded-lg border px-3 py-2 text-xs font-semibold" onClick={()=>set("offers",[...value.offers,{min_quantity:"2",total_price:"",label:"",free_shipping:false}])}>+ Offre</button>
      </details>

      <div className="grid gap-3 md:grid-cols-2">
        <div><label className="mb-1 block text-xs font-bold text-slate-600">Produits connexes</label><select multiple className={input+" min-h-28"} value={value.related_names.split(",").filter(Boolean)} onChange={e=>set("related_names",Array.from(e.target.selectedOptions,o=>o.value).join(","))}>{productNames.filter(n=>n!==value.name).map(n=><option key={n} value={n}>{n}</option>)}</select></div>
        <div><label className="mb-1 block text-xs font-bold text-slate-600">Cross-selling</label><select multiple className={input+" min-h-28"} value={value.cross_sell_names.split(",").filter(Boolean)} onChange={e=>set("cross_sell_names",Array.from(e.target.selectedOptions,o=>o.value).join(","))}>{productNames.filter(n=>n!==value.name).map(n=><option key={n} value={n}>{n}</option>)}</select></div>
      </div>

      <div className="flex gap-3 border-t pt-3"><button type="button" onClick={onDuplicate} className="text-xs font-bold text-violet-600">Dupliquer</button><button type="button" onClick={onRemove} className="text-xs font-bold text-red-600">Supprimer</button></div>
    </div>}
  </div>;
}
