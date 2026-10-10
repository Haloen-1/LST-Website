import {allowedOrigin} from './origins.mjs';
export async function galleryApi(request,env,content,mode='gallery'){
 const table=mode==='timeline'?'timeline_reactions':'gallery_likes',column=mode==='timeline'?'item_id':'photo_id',items=mode==='timeline'?content.timeline.filter(t=>t.visible):content.gallery;
 const url=new URL(request.url),json=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
 let visitor=request.headers.get('cookie')?.match(/(?:^|;\s*)lst_gallery=([a-f0-9-]{36})(?:;|$)/)?.[1];
 if(request.method==='POST'){
  if(!allowedOrigin(request,env)||request.headers.get('x-lst-gallery')!=='1')return json({error:'Please like photos from this website.'},403);
  const id=url.pathname.match(/^\/api\/(?:gallery|timeline)\/([-a-z0-9]{1,80})\/like$/)?.[1];
  if(!id||!items.some(p=>p.id===id))return json({error:'Photo not found.'},404);
  if(!request.headers.get('content-type')?.startsWith('application/json')||Number(request.headers.get('content-length'))>100)return json({error:'Invalid like request.'},400);
  const reader=request.body?.getReader();let raw='';if(reader){while(true){const chunk=await reader.read();if(chunk.done)break;raw+=new TextDecoder().decode(chunk.value);if(raw.length>100){await reader.cancel();return json({error:'Invalid like request.'},400);}}}
  let value;try{value=JSON.parse(raw);}catch{return json({error:'Invalid like request.'},400);}if(typeof value.liked!=='boolean')return json({error:'Choose like or unlike.'},400);
  visitor??=crypto.randomUUID();
  if(value.liked)await env.DB.prepare(`INSERT INTO ${table} (${column}, visitor_id) VALUES (?, ?) ON CONFLICT(${column}, visitor_id) DO NOTHING`).bind(id,visitor).run();
  else await env.DB.prepare(`DELETE FROM ${table} WHERE ${column} = ? AND visitor_id = ?`).bind(id,visitor).run();
  const count=await env.DB.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${column} = ?`).bind(id).first();
  return json({id,liked:value.liked,count:count.count},200,{'Set-Cookie':`lst_gallery=${visitor}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${url.protocol==='https:'?'; Secure':''}`});
 }
 if(request.method!=='GET'||url.pathname!=='/api/'+mode)return json({error:'Not found.'},404);
 const totals=await env.DB.prepare(`SELECT ${column} AS photo_id, COUNT(*) AS count FROM ${table} GROUP BY ${column}`).all();
 const liked=visitor?await env.DB.prepare(`SELECT ${column} AS photo_id FROM ${table} WHERE visitor_id = ?`).bind(visitor).all():{results:[]};
 const counts=new Map(totals.results.map(r=>[r.photo_id,r.count])),mine=new Set(liked.results.map(r=>r.photo_id));
 return json({photos:items.map(p=>({id:p.id,count:counts.get(p.id)??0,liked:mine.has(p.id)}))});
}
