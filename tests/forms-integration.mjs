import assert from 'node:assert/strict';import {createHmac} from 'node:crypto';import fs from 'node:fs';import {harness} from './harness.mjs';
const secret='local-test-only-form-sync-secret-1234567890';
const h=await harness({FORM_SYNC_SECRET:secret});
const formUrl='https://docs.google.com/forms/d/e/test-public-form/viewform';
try{
 const content=JSON.parse(fs.readFileSync('src/default-content.json'));content.events=[{...content.events[0],id:'test-event',title:'Test workshop',status:'upcoming',startDate:'2099-01-01',visible:true,signupMode:'external',registrationUrl:formUrl,responseLimit:2}];
 content.kits=[{id:'test-kit',title:'Test kit',description:'**Science**',price:'NT$500',formUrl:formUrl+'?usp=sf_link',photo:{...content.photos.hero,caption:'Editable kit caption'},responseLimit:2,soldOut:false,visible:true}];
 let r=await h.post('/api/editor/publish',{content,revision:0});assert.equal(r.status,200,await r.clone().text());
 const payload=(type,count,extra={})=>({type,id:'test-'+type,formUrl,count,accepting:true,observedAt:Date.now(),...extra});
 const send=(data,signature)=>{const body=JSON.stringify(data);return h.request('/api/forms/sync',{method:'POST',headers:{'Content-Type':'application/json','X-LST-Signature':signature??createHmac('sha256',secret).update(body).digest('hex')},body});};
 assert.equal((await send(payload('kit',2),'0'.repeat(64))).status,401);
 assert.equal((await send(null)).status,400);
 assert.equal((await send(payload('kit',2,{observedAt:Date.now()-600000}))).status,400);
 assert.equal((await send(payload('kit',2,{formUrl:formUrl.replace('test-public','different')}))).status,409);
 assert.equal((await send(payload('kit',1))).status,200);
 assert.match(await(await h.request('/kits')).text(),/Order via Google Form/);
 for(const type of ['kit','event']){r=await send(payload(type,2,{observedAt:Date.now()+1000}));assert.equal(r.status,200);assert.equal((await r.json()).closed,true);}
 assert.match(await(await h.request('/kits')).text(),/Out of stock/);
 assert.match(await(await h.request('/events/test-event')).text(),/Registration closed/);
 assert.equal((await(await send(payload('kit',0))).json()).closed,true,'Older reports must not reopen availability');
 assert.equal((await h.request('/api/editor')).status,401,'Admin remains protected');
 const admin=await(await h.request('/api/editor',{headers:h.headers})).json();assert.equal(admin.formSyncConfigured,true);assert.equal(admin.formAvailability.kits[0].formCount,2);assert.equal(admin.content.kits[0].responseLimit,2);
 content.kits[0].formUrl=formUrl.replace('test-public','new-public');assert.equal((await h.post('/api/editor/publish',{content,revision:1})).status,200);
 assert.match(await(await h.request('/kits')).text(),/Order via Google Form/,'Old form counts do not apply to replacement forms');
 content.kits[0].visible=false;assert.equal((await h.post('/api/editor/publish',{content,revision:2})).status,200);
 assert.equal((await send(payload('kit',1,{formUrl:content.kits[0].formUrl}))).status,409);
 assert.ok(!(await(await h.request('/kits')).text()).includes('Test kit'));
 console.log('PASS: editable kits, signed form counts, limit closure, replay ordering, changed forms, hidden products, and protected admin.');
}finally{await h.mf.dispose();}
