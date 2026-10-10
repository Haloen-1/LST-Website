import {allowedOrigin} from './origins.mjs';
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function submitSignup(request,env,content){
 if(request.method!=='POST')return json({error:'Method not allowed.'},405);
 if(!allowedOrigin(request,env)||request.headers.get('x-lst-signup')!=='1'||!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Please use the signup form on this website.'},403);
 const reader=request.body?.getReader();let raw='',size=0;if(reader){while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8000){await reader.cancel();return json({error:'The form is too large.'},413);}raw+=new TextDecoder().decode(value);}}
 let data;try{data=JSON.parse(raw);}catch{return json({error:'Please check the form and try again.'},400);}
 if(data.website)return json({error:'Please try again.'},400);
 const event=content.events.find(e=>e.id===data.eventId&&e.visible);
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 if(!event||event.signupMode!=='builtin'||event.status==='past'||event.status==='auto'&&(event.endDate||event.startDate)<today)return json({error:'Signup is closed for this event.'},409);
 const name=typeof data.name==='string'?data.name.trim():'',email=typeof data.email==='string'?data.email.trim().toLowerCase():'';
 if(!name||name.length>120||email.length>254||!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)||data.privacyAccepted!==true||typeof data.emailOptIn!=='boolean')return json({error:'Enter the participant’s name, a valid parent/guardian email, and accept the privacy notice.'},400);
 // A short-lived hash limits repeated automated submissions without storing raw IP addresses.
 const hour=new Date().toISOString().slice(0,13);const ip=request.headers.get('cf-connecting-ip')||email;
 const fingerprint=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(env.PUBLIC_ORIGIN+'|'+hour+'|'+ip)))).map(b=>b.toString(16).padStart(2,'0')).join('');
 const rate=await env.DB.prepare('INSERT INTO signup_limits (id, attempts, created_at) VALUES (?, 1, ?) ON CONFLICT(id) DO UPDATE SET attempts = attempts + 1 RETURNING attempts').bind(fingerprint,new Date().toISOString()).first();
 if(rate.attempts>20)return json({error:'Too many signup attempts. Please try again in an hour or contact our team.'},429);
 const id=crypto.randomUUID(),createdAt=new Date().toISOString();
 await env.DB.prepare('INSERT INTO signups (id, event_id, event_title, participant_name, email, email_opt_in, created_at, privacy_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(event_id, email, participant_name) DO NOTHING').bind(id,event.id,event.title,name,email,data.emailOptIn?1:0,createdAt,'2026-09-24').run();
 await env.DB.prepare('DELETE FROM signup_limits WHERE created_at < ?').bind(new Date(Date.now()-86400000).toISOString()).run();
 return json({ok:true,message:'Your signup request has been received. Our team will email you to confirm availability. This is not yet a confirmed place.'},201);
}
const csvCell=value=>'"'+(/^[\s]*[=+@-]/.test(String(value??''))?"'":'')+String(value??'').replaceAll('"','""')+'"';
export async function adminSignups(request,env){
 const url=new URL(request.url),exporting=url.pathname==='/api/editor/signups.csv',optedIn=url.searchParams.get('list')==='email';
 const columns='id, event_id, event_title, participant_name, email, email_opt_in, created_at';
 if(exporting){const result=await env.DB.prepare(`SELECT ${columns} FROM signups ${optedIn?'WHERE email_opt_in = 1':''} ORDER BY created_at DESC`).all();let rows=result.results;
  if(optedIn){const seen=new Set();rows=rows.filter(r=>{if(seen.has(r.email))return false;seen.add(r.email);return true;});}
  const keys=optedIn?['email','created_at']:['event_title','participant_name','email','email_opt_in','created_at'];const csv='\uFEFF'+[keys.map(csvCell).join(','),...rows.map(r=>keys.map(k=>csvCell(r[k])).join(','))].join('\r\n');
  return new Response(csv,{headers:{'Content-Type':'text/csv;charset=utf-8','Content-Disposition':'attachment; filename="'+(optedIn?'email-list':'workshop-signups')+'.csv"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }
 const offset=Math.max(0,Math.min(100000,Number(url.searchParams.get('offset'))||0));const result=await env.DB.prepare(`SELECT ${columns} FROM signups ORDER BY created_at DESC LIMIT 51 OFFSET ?`).bind(Math.floor(offset)).all();return json({rows:result.results.slice(0,50),hasMore:result.results.length>50,offset});
}
