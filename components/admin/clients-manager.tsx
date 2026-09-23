"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface AdminClientRow {
  id: string;
  name: string;
  status: "active" | "suspended";
  internal_notes: string | null;
  created_at: string;
  store_count: number;
}

const input = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm";
const primary = "rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50";

async function request(url:string, method:string, body?:Record<string,unknown>) {
  const response=await fetch(url,{method,headers:body?{"Content-Type":"application/json"}:undefined,body:body?JSON.stringify(body):undefined});
  const data=(await response.json().catch(()=>({}))) as {ok?:boolean;id?:string;error?:{message?:string}|string};
  if(!response.ok||!data.ok){
    const message=typeof data.error==="string"?data.error:data.error?.message;
    throw new Error(message||"Opération impossible");
  }
  return data;
}

export function ClientsManager({ clients }: { clients:AdminClientRow[] }) {
  const router=useRouter();
  const [rows,setRows]=useState(clients);
  const [draft,setDraft]=useState({name:"",internal_notes:""});
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  async function createClient(event:React.FormEvent){
    event.preventDefault();setBusy(true);setMessage("");
    try{await request("/api/admin/clients","POST",draft);setDraft({name:"",internal_notes:""});setMessage("Client ajouté.");router.refresh();}
    catch(error){setMessage(error instanceof Error?error.message:"Erreur");}finally{setBusy(false);}
  }
  async function updateClient(row:AdminClientRow){
    setBusy(true);setMessage("");
    try{await request(`/api/admin/clients/${row.id}`,"PATCH",{action:"update",name:row.name,internal_notes:row.internal_notes??""});setMessage("Client modifié.");router.refresh();}
    catch(error){setMessage(error instanceof Error?error.message:"Erreur");}finally{setBusy(false);}
  }
  async function toggleClient(row:AdminClientRow){
    const status=row.status==="active"?"suspended":"active";
    setBusy(true);setMessage("");
    try{await request(`/api/admin/clients/${row.id}`,"PATCH",{action:"status",status});setRows(current=>current.map(item=>item.id===row.id?{...item,status}:item));setMessage(status==="suspended"?"Client suspendu : ses accès et ses boutiques publiques sont bloqués.":"Client réactivé.");router.refresh();}
    catch(error){setMessage(error instanceof Error?error.message:"Erreur");}finally{setBusy(false);}
  }
  async function deleteClient(row:AdminClientRow){
    if(!window.confirm(`Supprimer le client « ${row.name} » ? Les données et sites seront conservés mais bloqués.`))return;
    setBusy(true);setMessage("");
    try{await request(`/api/admin/clients/${row.id}`,"DELETE");setRows(current=>current.filter(item=>item.id!==row.id));setMessage("Client supprimé. Ses données restent conservées.");router.refresh();}
    catch(error){setMessage(error instanceof Error?error.message:"Erreur");}finally{setBusy(false);}
  }

  return <div className="space-y-5">
    <form onSubmit={createClient} className="grid gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-5 md:grid-cols-2">
      <div className="md:col-span-2"><h2 className="font-bold text-violet-950">Ajouter un client</h2><p className="mt-1 text-xs text-violet-700">Crée l’organisation cliente. Vous pourrez ensuite lui créer un site et inviter ses utilisateurs.</p></div>
      <label className="text-sm font-semibold">Nom / entreprise<input className={input} value={draft.name} onChange={event=>setDraft({...draft,name:event.target.value})} required minLength={2}/></label>
      <label className="text-sm font-semibold">Notes internes<textarea className={input} rows={2} value={draft.internal_notes} onChange={event=>setDraft({...draft,internal_notes:event.target.value})}/></label>
      <div className="md:col-span-2"><button className={primary} disabled={busy}>{busy?"Enregistrement…":"Ajouter le client"}</button></div>
    </form>

    {message&&<p role="status" className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</p>}
    {rows.length===0&&<p className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-400">Aucun client.</p>}
    <div className="space-y-3">
      {rows.map((row,index)=><section key={row.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div><div className="font-bold text-slate-900">{row.name}</div><div className="text-xs text-slate-500">{row.store_count} site(s) · créé le {new Date(row.created_at).toLocaleDateString("fr-FR")}</div></div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${row.status==="active"?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>{row.status==="active"?"Actif":"Suspendu"}</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">Nom / entreprise<input className={input} value={row.name} onChange={event=>setRows(rows.map((item,i)=>i===index?{...item,name:event.target.value}:item))}/></label>
          <label className="text-xs font-semibold text-slate-600">Notes internes<textarea className={input} rows={2} value={row.internal_notes??""} onChange={event=>setRows(rows.map((item,i)=>i===index?{...item,internal_notes:event.target.value}:item))}/></label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <a href={`/admin/sites?q=${encodeURIComponent(row.name)}`} className="text-sm font-semibold text-blue-600 hover:underline">Voir ses sites →</a>
          <div className="flex flex-wrap gap-2"><button type="button" disabled={busy} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" onClick={()=>void updateClient(row)}>Enregistrer</button><button type="button" disabled={busy} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-700 disabled:opacity-50" onClick={()=>void toggleClient(row)}>{row.status==="active"?"Suspendre":"Réactiver"}</button><button type="button" disabled={busy} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50" onClick={()=>void deleteClient(row)}>Supprimer</button></div>
        </div>
      </section>)}
    </div>
  </div>;
}
