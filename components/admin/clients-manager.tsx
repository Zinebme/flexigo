"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface AdminClientRow {
  id: string;
  name: string;
  status: "active" | "suspended";
  internal_notes: string | null;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string | null;
  store_count: number;
  sites: Array<{
    id: string;
    organization_id: string | null;
    name: string;
    slug: string;
    status: string;
    website_type: string;
    template_key: string;
    created_at: string;
  }>;
  users: Array<{
    id: string;
    user_id: string;
    store_id: string;
    store_name: string;
    email: string | null;
    full_name: string | null;
    dashboard_language: string;
    role: string;
    status: string;
    is_owner: boolean;
  }>;
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
  const [openId,setOpenId]=useState<string|null>(null);
  const [busyId,setBusyId]=useState<string|null>(null);
  const [message,setMessage]=useState("");

  async function createClient(event:React.FormEvent){
    event.preventDefault();setBusyId("create");setMessage("");
    try{await request("/api/admin/clients","POST",draft);setDraft({name:"",internal_notes:""});setMessage("Client ajouté.");router.refresh();}
    catch(error){setMessage(error instanceof Error?error.message:"Erreur");}finally{setBusyId(null);}
  }
  async function updateClient(row:AdminClientRow){
    setBusyId(row.id);setMessage("");
    try{await request(`/api/admin/clients/${row.id}`,"PATCH",{action:"update",name:row.name,internal_notes:row.internal_notes??""});setMessage("Fiche client modifiée.");router.refresh();}
    catch(error){setMessage(error instanceof Error?error.message:"Erreur");}finally{setBusyId(null);}
  }
  async function toggleClient(row:AdminClientRow){
    const status=row.status==="active"?"suspended":"active";
    setBusyId(row.id);setMessage("");
    try{await request(`/api/admin/clients/${row.id}`,"PATCH",{action:"status",status});setRows(current=>current.map(item=>item.id===row.id?{...item,status}:item));setMessage(status==="suspended"?"Client suspendu : ses accès et ses boutiques publiques sont bloqués.":"Client réactivé.");router.refresh();}
    catch(error){setMessage(error instanceof Error?error.message:"Erreur");}finally{setBusyId(null);}
  }
  async function deleteClient(row:AdminClientRow){
    if(!window.confirm(`Supprimer le client « ${row.name} » ? Les données et sites seront conservés mais bloqués.`))return;
    setBusyId(row.id);setMessage("");
    try{await request(`/api/admin/clients/${row.id}`,"DELETE");setRows(current=>current.filter(item=>item.id!==row.id));if(openId===row.id)setOpenId(null);setMessage("Client supprimé. Ses données restent conservées.");router.refresh();}
    catch(error){setMessage(error instanceof Error?error.message:"Erreur");}finally{setBusyId(null);}
  }

  return <div className="space-y-5">
    <form onSubmit={createClient} className="grid gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-5 md:grid-cols-2">
      <div className="md:col-span-2"><h2 className="font-bold text-violet-950">Ajouter un client</h2><p className="mt-1 text-xs text-violet-700">Crée l’organisation cliente. La fiche complète regroupera ensuite ses sites et ses comptes.</p></div>
      <label className="text-sm font-semibold">Nom / entreprise<input className={input} value={draft.name} onChange={event=>setDraft({...draft,name:event.target.value})} required minLength={2}/></label>
      <label className="text-sm font-semibold">Notes internes<textarea className={input} rows={2} value={draft.internal_notes} onChange={event=>setDraft({...draft,internal_notes:event.target.value})}/></label>
      <div className="md:col-span-2"><button className={primary} disabled={busyId==="create"}>{busyId==="create"?"Enregistrement…":"Ajouter le client"}</button></div>
    </form>

    {message&&<p role="status" className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</p>}
    {rows.length===0&&<p className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-400">Aucun client.</p>}

    <div className="space-y-3">
      {rows.map((row,index)=>{
        const open=openId===row.id;
        const uniquePeople=new Map(row.users.map((user)=>[user.user_id,user]));
        return <section key={row.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${open?"border-violet-300 ring-2 ring-violet-100":"border-slate-200"}`}>
          <button type="button" onClick={()=>setOpenId(open?null:row.id)} className="flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-slate-50">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><span className="truncate font-bold text-slate-900">{row.name}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${row.status==="active"?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>{row.status==="active"?"Actif":"Suspendu"}</span></div>
              <div className="mt-1 text-xs text-slate-500">{row.store_count} site(s) · {uniquePeople.size} compte(s) · créé le {new Date(row.created_at).toLocaleDateString("fr-FR")}</div>
            </div>
            <span className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold text-violet-700">{open?"Fermer la fiche":"Ouvrir la fiche client"}</span>
          </button>

          {open&&<div className="space-y-5 border-t border-slate-100 p-5">
            <section className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3"><h3 className="font-bold text-slate-900">Informations client</h3><p className="text-xs text-slate-500">Vous pouvez modifier la fiche directement ici.</p></div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600">Nom / entreprise<input className={input} value={row.name} onChange={event=>setRows(rows.map((item,i)=>i===index?{...item,name:event.target.value}:item))}/></label>
                <label className="text-xs font-semibold text-slate-600">Statut<input className={input} value={row.status==="active"?"Actif":"Suspendu"} readOnly/></label>
                <label className="text-xs font-semibold text-slate-600 md:col-span-2">Notes internes<textarea className={input} rows={4} value={row.internal_notes??""} onChange={event=>setRows(rows.map((item,i)=>i===index?{...item,internal_notes:event.target.value}:item))}/></label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" disabled={busyId===row.id} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" onClick={()=>void updateClient(row)}>Enregistrer les modifications</button>
                <button type="button" disabled={busyId===row.id} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-700 disabled:opacity-50" onClick={()=>void toggleClient(row)}>{row.status==="active"?"Suspendre le client":"Réactiver le client"}</button>
                <button type="button" disabled={busyId===row.id} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50" onClick={()=>void deleteClient(row)}>Supprimer le client</button>
              </div>
            </section>

            <section>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-bold text-slate-900">Sites ({row.sites.length})</h3><p className="text-xs text-slate-500">Accès direct à chaque site pour gérer produits, catégories, commandes, intégrations et paramètres.</p></div><a href={`/admin/sites?q=${encodeURIComponent(row.name)}`} className="text-xs font-semibold text-blue-600 hover:underline">Voir dans la liste des sites →</a></div>
              {row.sites.length===0?<p className="rounded-xl border border-dashed p-4 text-sm text-slate-400">Aucun site créé pour ce client.</p>:<div className="grid gap-3 md:grid-cols-2">
                {row.sites.map((site)=><a key={site.id} href={`/admin/sites/${site.id}`} className="rounded-xl border border-slate-200 p-4 transition hover:border-violet-300 hover:bg-violet-50/30">
                  <div className="flex items-start justify-between gap-2"><div><div className="font-semibold text-slate-900">{site.name}</div><div className="mt-1 font-mono text-xs text-slate-500">/{site.slug}</div></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{site.status}</span></div>
                  <div className="mt-3 text-xs text-slate-500">{site.website_type} · {site.template_key}</div>
                </a>)}
              </div>}
            </section>

            <section>
              <div className="mb-3"><h3 className="font-bold text-slate-900">Comptes et accès ({row.users.length})</h3><p className="text-xs text-slate-500">Vue des utilisateurs rattachés aux boutiques de ce client. Les rôles et suspensions d’accès se gèrent depuis la fiche du site concerné.</p></div>
              {row.users.length===0?<p className="rounded-xl border border-dashed p-4 text-sm text-slate-400">Aucun compte rattaché.</p>:<div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Utilisateur</th><th className="px-3 py-2">Site</th><th className="px-3 py-2">Rôle</th><th className="px-3 py-2">Accès</th><th className="px-3 py-2"></th></tr></thead><tbody className="divide-y divide-slate-100">
                  {row.users.map((user)=><tr key={user.id}><td className="px-3 py-3"><div className="font-semibold text-slate-800">{user.full_name||user.email||user.user_id}</div><div className="text-xs text-slate-400">{user.email||"Email indisponible"}{user.is_owner?" · propriétaire principal":""}</div></td><td className="px-3 py-3 text-slate-600">{user.store_name}</td><td className="px-3 py-3"><span className="rounded bg-slate-100 px-2 py-1 text-xs">{user.role}</span></td><td className="px-3 py-3"><span className={user.status==="active"?"text-emerald-600":"text-amber-600"}>{user.status==="active"?"Actif":"Suspendu"}</span></td><td className="px-3 py-3"><a href={`/admin/sites/${user.store_id}?tab=account`} className="text-xs font-semibold text-violet-700 hover:underline">Gérer →</a></td></tr>)}
                </tbody></table>
              </div>}
            </section>
          </div>}
        </section>;
      })}
    </div>
  </div>;
}
