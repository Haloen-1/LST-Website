import assert from 'node:assert/strict';import {defaults} from '../src/content.mjs';
import {harness} from './harness.mjs';
const {mf,headers:owner,request:req,post:send}=await harness();
const post=(path,data,headers=owner)=>req(path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
try{
const initial=await(await req('/api/editor',{headers:owner})).json();let revision=initial.revision;const content=structuredClone(defaults);const suffix=Date.now().toString();const event={...content.events[0],id:'signup-test-'+suffix,title:'Test workshop',description:'**Lesson overview**\nA safe test description.',startDate:'2099-01-01',status:'upcoming',signupMode:'builtin',visible:true};content.events.unshift(event);content.timeline.push({id:'lesson-test-'+suffix,title:'Test lesson',date:'2099-01-01',description:'**Lesson notes**',eventId:event.id,visible:true});content.metrics[0].value='60+';content.team[0].photo={...defaults.photos.hero};
const published=await post('/api/editor/publish',{content,revision});assert.equal(published.status,200);revision=(await published.json()).revision;
try{
 assert.equal((await req('/api/editor/signups')).status,401);assert.equal((await req('/api/editor/signups.csv')).status,401);
 const detail=await(await req('/events/'+event.id)).text();assert.ok(detail.includes('class="signup-form"'));assert.ok(detail.includes('<strong>Lesson overview</strong>'));assert.ok(!(await(await req('/')).text()).includes('id="experience"'));
 const headers={Origin:owner.Origin,'X-LST-Signup':'1','Content-Type':'application/json'};const data={eventId:event.id,name:'=SUM(1+1)',email:'test-'+suffix+'@example.invalid',privacyAccepted:true,emailOptIn:false,website:''};
 assert.equal((await post('/api/signup',data,{...headers,Origin:'https://other.invalid'})).status,403);assert.equal((await post('/api/signup',{...data,privacyAccepted:false},headers)).status,400);assert.equal((await post('/api/signup',{...data,website:'bot'},headers)).status,400);assert.equal((await post('/api/signup',{...data,eventId:defaults.events[0].id},headers)).status,409);
 assert.equal((await post('/api/signup',data,headers)).status,201);assert.equal((await post('/api/signup',data,headers)).status,201);
 let records=await(await req('/api/editor/signups',{headers:owner})).json();assert.equal(records.rows.filter(r=>r.email===data.email).length,1,'Duplicate signup was stored twice');
 const optEmail='optin-'+suffix+'@example.invalid';assert.equal((await post('/api/signup',{...data,name:'Local test',email:optEmail,emailOptIn:true},headers)).status,201);
 const csv=await(await req('/api/editor/signups.csv',{headers:owner})).text();assert.ok(csv.includes("\"'=SUM(1+1)\""),'CSV formula not neutralized');const opted=await(await req('/api/editor/signups.csv?list=email',{headers:owner})).text();assert.ok(opted.includes(optEmail));assert.ok(!opted.includes(data.email),'Non-consenting email leaked into marketing export');
 const lesson=await(await req('/timeline/'+content.timeline.at(-1).id)).text();assert.ok(lesson.includes('<strong>Lesson notes</strong>'));assert.ok(lesson.includes('/events/'+event.id));assert.equal((await req('/cookies')).status,200);assert.equal((await req('/team')).status,200);
 assert.equal((await post('/api/timeline/retired/like',{liked:true})).status,410);
 console.log('PASS: signup storage, deduplication, privacy consent, separate email opt-ins, CSV safety, private exports, styled lessons, retired timeline reactions, team pages, and cookies.');
}finally{assert.equal((await post('/api/editor/publish',{content:defaults,revision})).status,200);}

}finally{await mf.dispose();}
