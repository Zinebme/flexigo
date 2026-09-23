import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminContext } from "@/lib/auth/admin-context";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { parseBody } from "@/lib/schemas";
import { toErrorResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createClientSchema=z.object({
  name:z.string().trim().min(2).max(120),
  internal_notes:z.string().trim().max(2000).optional().or(z.literal("")).nullable(),
});

export async function POST(req:Request){
  try{
    const ctx=await getAdminContext();
    const input=parseBody(createClientSchema,await req.json().catch(()=>null));
    const admin=getAdminSupabase();
    const {data,error}=await admin.from("organizations").insert({
      name:input.name,
      internal_notes:input.internal_notes||null,
      status:"active",
      created_by:ctx.user.id,
    } as never).select("id").single();
    if(error)throw error;
    const id=(data as {id:string}).id;
    await logAudit({actorId:ctx.user.id,action:"client.created",entity:"organization",entityId:id,metadata:{name:input.name}});
    return NextResponse.json({ok:true,id});
  }catch(error){return toErrorResponse(error);}
}
