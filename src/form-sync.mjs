import {googleFormUrl} from './kits.mjs';
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function syncForm(request,env,content){
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 if(!env.FORM_SYNC_SECRET||env.FORM_SYNC_SECRET.length<32)return json({error:'Form sync is not configured'},503);
 const signature=request.headers.get('X-LST-Signature')||'';if(!/^[a-f0-9]{64}$/.test(signature))return json({error:'Unauthorized'},401);
 const reader=request.body?.getReader();let size=0,chunks=[];if(!reader)return json({error:'Invalid request'},400);while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>4096){await reader.cancel();return json({error:'Request too large'},413);}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.FORM_SYNC_SECRET),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 const sig=Uint8Array.from(signature.match(/../g),v=>parseInt(v,16));if(!await crypto.subtle.verify('HMAC',key,sig,bytes))return json({error:'Unauthorized'},401);
 let data;try{data=JSON.parse(new TextDecoder().decode(bytes));}catch{return json({error:'Invalid request'},400);}
 if(!data||typeof data!=='object'||!['event','kit'].includes(data.type)||typeof data.id!=='string'||!Number.isInteger(data.count)||data.count<0||data.count>1000000||typeof data.accepting!=='boolean'||!Number.isInteger(data.observedAt)||Math.abs(Date.now()-data.observedAt)>300000)return json({error:'Invalid or expired sync'},400);
 const item=(data.type==='event'?content.events:content.kits||[]).find(x=>x.id===data.id&&x.visible);
 const expected=googleFormUrl(data.type==='event'?item?.registrationUrl:item?.formUrl);
 if(!item||!expected||expected!==googleFormUrl(data.formUrl)||data.type==='event'&&item.signupMode!=='external')return json({error:'No matching published Google Form'},409);
 const id=data.type+':'+data.id;
 await env.DB.prepare('INSERT INTO form_counts (id,form_url,response_count,accepting,observed_at) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET form_url=excluded.form_url,response_count=excluded.response_count,accepting=excluded.accepting,observed_at=excluded.observed_at WHERE excluded.observed_at>form_counts.observed_at').bind(id,expected,data.count,data.accepting?1:0,data.observedAt).run();
 const current=await env.DB.prepare('SELECT response_count,accepting FROM form_counts WHERE id=?').bind(id).first();
 return json({ok:true,limit:item.responseLimit??null,closed:item.soldOut===true||!current.accepting||!!item.responseLimit&&current.response_count>=item.responseLimit});
}
export async function withAvailability(env,content){
 const candidates=[...(content.kits||[]).map(k=>({type:'kit',item:k,url:k.formUrl})),...content.events.filter(e=>e.signupMode==='external').map(e=>({type:'event',item:e,url:e.registrationUrl}))].filter(c=>googleFormUrl(c.url));
 if(!candidates.length)return content;
 const rows=(await env.DB.prepare('SELECT id,form_url,response_count,accepting,observed_at FROM form_counts').all()).results;const counts=new Map(rows.map(r=>[r.id,r]));
 const decorate=(item,type,url)=>{const row=counts.get(type+':'+item.id);if(!row||row.form_url!==googleFormUrl(url))return item;return {...item,formCount:row.response_count,formSyncedAt:row.observed_at,formClosed:!row.accepting||!!item.responseLimit&&row.response_count>=item.responseLimit};};
 return {...content,kits:(content.kits||[]).map(k=>decorate(k,'kit',k.formUrl)),events:content.events.map(e=>e.signupMode==='external'?decorate(e,'event',e.registrationUrl):e)};
}
