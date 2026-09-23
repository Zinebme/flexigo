import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { parseBody } from "@/lib/schemas";
import { toErrorResponse, err } from "@/lib/errors";
import { invalidateStoreCaches } from "@/lib/storefront/resolve";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const updateSchema=z.discriminatedUnion("action",[
  z.object({action:z.literal("update"),name:z.string().trim().min(2).max(120),internal_notes:z.string().trim().max(2000).optional().or(z.literal("")).nullable()}),
  z.object({action:z.literal("status"),status:z.enum(["active","suspended"])}),
]);

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const {id}=await params;
    const ctx=await getAdminContext();
    const input=parseBody(updateSchema,await req.json().catch(()=>null));
    const admin=getAdminSupabase();
    const {data:current}=await admin.from("organizations").select("id, name, status").eq("id",id).is("deleted_at",null).maybeSingle();
    if(!current)throw err("NOT_FOUND","Client introuvable.");
    const patch=input.action==="update"
      ? {name:input.name,internal_notes:input.internal_notes||null,updated_at:new Date().toISOString()}
      : {status:input.status,updated_at:new Date().toISOString()};
    const {error}=await admin.from("organizations").update(patch as never).eq("id",id).is("deleted_at",null);
    if(error)throw error;
    invalidateStoreCaches();
    await logAudit({actorId:ctx.user.id,action:input.action==="status"?"client.suspended":"client.updated",entity:"organization",entityId:id,metadata:input.action==="status"?{from:(current as {status:string}).status,to:input.status}:{name:input.name}});
    return NextResponse.json({ok:true});
  }catch(error){return toErrorResponse(error);}
}

export async function DELETE(_req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const {id}=await params;
    const ctx=await getAdminContext();
    const admin=getAdminSupabase();
    const {data:current}=await admin.from("organizations").select("id, name").eq("id",id).is("deleted_at",null).maybeSingle();
    if(!current)throw err("NOT_FOUND","Client introuvable.");
    const now=new Date().toISOString();
    const {error}=await admin.from("organizations").update({status:"suspended",deleted_at:now,updated_at:now} as never).eq("id",id);
    if(error)throw error;
    invalidateStoreCaches();
    await logAudit({actorId:ctx.user.id,action:"client.deleted",entity:"organization",entityId:id,metadata:{name:(current as {name:string}).name,soft_delete:true}});
    return NextResponse.json({ok:true});
  }catch(error){return toErrorResponse(error);}
}
