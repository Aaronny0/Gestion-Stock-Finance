"use client";
import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {request} from "@/frontend/api";
import {useWorkspace} from "@/frontend/provider";
export function DocumentLink({documentId,storeId}:{documentId:unknown;storeId?:string}){
 const {snapshot}=useWorkspace();const [url,setUrl]=useState("");const [error,setError]=useState("");const [busy,setBusy]=useState(false);
 useEffect(()=>{if(!url)return;const timer=setTimeout(()=>setUrl(""),55000);return()=>clearTimeout(timer)},[url]);
 if(typeof documentId!=="string"||!storeId)return null;
 return <div className="space-y-2">{url?<Button variant="outline" asChild><a href={url} target="_blank" rel="noopener noreferrer">Télécharger le justificatif</a></Button>:<Button variant="outline" disabled={busy} onClick={async()=>{setBusy(true);setError("");try{const result=await request<{url:string}>("documents/download-url",{method:"POST",body:JSON.stringify({organizationId:snapshot!.session.organization.id,storeId,documentId})});setUrl(result.url);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>{busy?"Préparation…":"Accéder au justificatif"}</Button>}{error?<p role="alert" className="text-sm text-destructive">{error}</p>:null}</div>;
}
