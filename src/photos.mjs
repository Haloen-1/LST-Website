export const PHOTO_LIMIT=5*1024*1024;
export async function storePhoto(env,bytes){
 const key=crypto.randomUUID()+'.jpg';
 const etag='"'+Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('')+'"';
 await env.PHOTOS.put(key,bytes,{metadata:{contentType:'image/jpeg',etag}});
 // A strongly consistent upload receipt avoids using eventually consistent KV reads
 // to decide whether an editor may save a just-uploaded photograph.
 await env.DB.prepare('INSERT INTO uploaded_photos (key, bytes, etag, created_at) VALUES (?, ?, ?, ?)').bind(key,bytes.byteLength,etag,new Date().toISOString()).run();
 return '/media/'+key;
}
export async function knownPhotos(env,paths){
 const keys=[...new Set(paths.filter(p=>p.startsWith('/media/')).map(p=>p.slice(7)))];
 if(!keys.length)return true;
 const known=new Set();
 // Bound each query to the requested keys and stay below D1's parameter limit.
 for(let offset=0;offset<keys.length;offset+=90){
  const batch=keys.slice(offset,offset+90);
  const rows=await env.DB.prepare('SELECT key FROM uploaded_photos WHERE key IN ('+batch.map(()=>'?').join(',')+')').bind(...batch).all();
  for(const row of rows.results)known.add(row.key);
 }
 return keys.every(k=>known.has(k));
}
export async function readPhoto(env,key){
 const {value,metadata}=await env.PHOTOS.getWithMetadata(key,{type:'arrayBuffer',cacheTtl:60});
 return value?{body:value,etag:metadata?.etag}:null;
}
