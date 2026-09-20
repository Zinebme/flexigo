"use client";

import { useState } from "react";

interface Msg { role:"user"|"assistant"; text:string }

export function SiteAssistant({ storeId, storeName }: { storeId:string; storeName:string }) {
  const [messages,setMessages]=useState<Msg[]>([
    {role:"assistant",text:`Assistant de modification pour « ${storeName} ». Je n’agis que sur ce site. Exemples : « couleur principale #7A4E3A », « couleur secondaire #EAD8C8 », « annonce: Livraison gratuite aujourd’hui », « nom du site: Maison Lina », « langue: ar ».`}
  ]);
  const [input,setInput]=useState("");
  const [busy,setBusy]=useState(false);

  async function send() {
    const message=input.trim();
    if(!message||busy) return;
    setInput("");
    setMessages(prev=>[...prev,{role:"user",text:message}]);
    setBusy(true);
    try{
      const res=await fetch(`/api/admin/stores/${storeId}/assistant`,{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message})
      });
      const data=(await res.json().catch(()=>({}))) as {ok?:boolean;reply?:string;error?:{message?:string}|string};
      const reply=res.ok&&data.ok?(data.reply??"Modification appliquée."):(typeof data.error==="string"?data.error:(data.error?.message??"Commande non comprise."));
      setMessages(prev=>[...prev,{role:"assistant",text:reply}]);
    }catch{
      setMessages(prev=>[...prev,{role:"assistant",text:"Impossible de contacter l’assistant."}]);
    }finally{setBusy(false);}
  }

  return <div className="rounded-2xl border border-violet-200 bg-white shadow-sm">
    <div className="border-b border-violet-100 bg-violet-50 px-5 py-4">
      <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white">✦</span><div><h3 className="text-sm font-bold text-slate-900">Assistant site</h3><p className="text-xs text-slate-500">Portée verrouillée à ce site. Les actions sont validées côté serveur et journalisées.</p></div></div>
    </div>
    <div className="max-h-[420px] space-y-3 overflow-auto p-5">
      {messages.map((m,i)=><div key={i} className={m.role==="user"?"ml-auto max-w-[82%] rounded-2xl bg-violet-600 px-4 py-3 text-sm text-white":"max-w-[88%] rounded-2xl bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700"}>{m.text}</div>)}
      {busy&&<div className="max-w-[60%] rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-400">Analyse…</div>}
    </div>
    <div className="border-t border-slate-100 p-4">
      <div className="flex gap-2">
        <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send();}}} className="min-h-12 flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100" placeholder="Ex : annonce: -10% aujourd’hui"/>
        <button type="button" onClick={send} disabled={busy||!input.trim()} className="rounded-xl bg-violet-600 px-4 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50">Envoyer</button>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">Cette version applique uniquement des modifications sûres et structurées. Aucun HTML/JS libre, aucune action sur un autre client.</p>
    </div>
  </div>
}
