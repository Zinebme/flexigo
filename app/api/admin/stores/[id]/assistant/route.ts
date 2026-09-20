import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toErrorResponse, err } from "@/lib/errors";

export const dynamic="force-dynamic";
export const runtime="nodejs";

const bodySchema=z.object({message:z.string().trim().min(2).max(1000)});
const HEX=/#([0-9a-fA-F]{6})/;

function textAfter(message:string, patterns:RegExp[]):string|null{
 for(const pattern of patterns){
  const m=message.match(pattern);
  if(m?.[1]?.trim()) return m[1].trim().slice(0,160);
 }
 return null;
}

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const {id}=await params;
  const ctx=await getAdminContext();
  const {message}=bodySchema.parse(await req.json().catch(()=>null));
  const admin=getAdminSupabase();
  const {data:store,error:storeErr}=await admin.from("stores").select("id,name,language").eq("id",id).is("deleted_at",null).maybeSingle();
  if(storeErr) throw storeErr;
  if(!store) throw err("NOT_FOUND","Site introuvable.");

  const lower=message.toLowerCase();
  const changes:string[]=[];

  if(/couleur\s+(principale|primaire)|primary\s+color/.test(lower)){
    const hex=message.match(HEX)?.[0];
    if(!hex) throw err("VALIDATION","Indiquez une couleur hexadécimale, par ex. #7A4E3A.");
    const {error}=await admin.from("themes").update({primary_color:hex}).eq("store_id",id);
    if(error) throw error; changes.push(`couleur principale → ${hex}`);
  }
  if(/couleur\s+secondaire|secondary\s+color/.test(lower)){
    const hex=message.match(HEX)?.[0];
    if(!hex) throw err("VALIDATION","Indiquez une couleur hexadécimale, par ex. #EAD8C8.");
    const {error}=await admin.from("themes").update({secondary_color:hex}).eq("store_id",id);
    if(error) throw error; changes.push(`couleur secondaire → ${hex}`);
  }
  if(/couleur\s+(de\s+)?fond|background/.test(lower)){
    const hex=message.match(HEX)?.[0];
    if(!hex) throw err("VALIDATION","Indiquez une couleur hexadécimale.");
    const {error}=await admin.from("themes").update({background_color:hex}).eq("store_id",id);
    if(error) throw error; changes.push(`fond → ${hex}`);
  }

  const announcement=textAfter(message,[/annonce\s*:\s*(.+)$/i,/announcement\s*:\s*(.+)$/i]);
  if(announcement){
    const {error}=await admin.from("themes").update({announcement}).eq("store_id",id);
    if(error) throw error; changes.push("annonce mise à jour");
  }

  const newName=textAfter(message,[/nom\s+(?:du\s+)?site\s*:\s*(.+)$/i,/rename\s*:\s*(.+)$/i]);
  if(newName){
    const {error}=await admin.from("stores").update({name:newName,updated_at:new Date().toISOString()}).eq("id",id);
    if(error) throw error; changes.push(`nom → ${newName}`);
  }

  const langMatch=message.match(/(?:langue|language)\s*:\s*(ar|fr|en)\b/i);
  if(langMatch?.[1]){
    const language=langMatch[1].toLowerCase() as "ar"|"fr"|"en";
    const {error}=await admin.from("stores").update({language,updated_at:new Date().toISOString()}).eq("id",id);
    if(error) throw error; changes.push(`langue → ${language}`);
  }

  if(changes.length===0){
    return NextResponse.json({ok:true,reply:"Je n’ai rien modifié. Pour cette version sécurisée, utilisez par exemple : « couleur principale #7A4E3A », « couleur secondaire #EAD8C8 », « annonce: … », « nom du site: … » ou « langue: ar ». Les modifications plus complexes restent disponibles dans les éditeurs du site."});
  }

  await logAudit({
    actorId:ctx.user.id,storeId:id,action:"store.settings_changed",entity:"store",entityId:id,
    metadata:{assistant:true,changes},ip:null
  });

  return NextResponse.json({ok:true,reply:`Appliqué uniquement à ce site : ${changes.join(" · ")}. Rechargez l’aperçu pour vérifier.`});
 }catch(e){return toErrorResponse(e);}
}
