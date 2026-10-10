import assert from 'node:assert/strict';import fs from 'node:fs';import {parseHTML} from 'linkedom';import {harness} from './harness.mjs';import {recoverSnapshot} from '../scripts/recover-snapshot.mjs';
const {mf,db,request,headers,post}=await harness();
try{
 const {content}=recoverSnapshot('published-snapshot');
 content.testimonials=[1,2,3].map(i=>({id:'test-review-'+i,quote:'Local test review '+i,name:'Test attribution '+i,context:'Test only',visible:true}));
 content.testimonials.push({id:'private-review',quote:'Unapproved private feedback',name:'Private name',context:'',visible:false});
 content.gallery[0].caption='An **editable** photo caption';
 const result=await post('/api/editor/save',{content,revision:0});assert.equal(result.status,200);const revision=(await result.json()).revision;
 assert.equal((await db.prepare('SELECT published_content FROM site_content WHERE id=?').bind('site').first()).published_content,null);
 const preview=parseHTML(await(await request('/?preview=draft',{headers})).text()).document;
 assert.equal(preview.querySelector('[data-metrics] strong').textContent,'60+');
 assert.equal((await post('/api/editor/publish',{content,revision})).status,200);
 for(const route of ['/','/events','/impact','/mission','/team','/timeline','/testimonials','/donate','/signup','/privacy.html','/cookies','/science-camp.html','/events/'+content.events[0].id,'/timeline/'+content.timeline[0].id]){
  const res=await request(route);assert.equal(res.status,200,route);const d=parseHTML(await res.text()).document;const pack=JSON.parse(d.querySelector('#lst-page-pack').textContent);assert.ok(pack.en.includes('lang="en"'));assert.ok(pack.zh.includes('lang="zh-Hant"'));assert.ok(d.querySelector('main'),route);
 }
 const home=parseHTML(await(await request('/')).text()).document;assert.equal(home.querySelector('.hero-actions [data-link="missionPage"]').getAttribute('href'),content.links.missionPage);assert.equal(home.querySelector('[data-new-tab]').getAttribute('target'),'_blank');assert.equal(home.querySelector('.dialog-caption'),null);assert.equal(home.querySelectorAll('[data-gallery] .gallery-item').length,3);
 assert.equal(home.querySelectorAll('[data-testimonial-carousel] .testimonial').length,3);
 assert.ok(!home.querySelector('[data-testimonial-carousel]').textContent.includes('Unapproved private feedback'));
 assert.equal(home.querySelector('[data-gallery] figcaption strong').textContent,'editable');
 assert.equal(home.querySelector('#testimonials a[href="/testimonials"]'),null);
 assert.equal(parseHTML(await(await request('/team')).text()).document.querySelector('[data-metrics]'),null);
 const signup=parseHTML(await(await request('/signup')).text()).document;assert.ok(signup.querySelector('iframe').getAttribute('src').startsWith('https://docs.google.com/forms/'));
 const chineseSignup=parseHTML(await(await request('/signup?lang=zh')).text()).document;
 assert.equal(chineseSignup.querySelector('main').textContent,signup.querySelector('main').textContent);
 assert.equal(chineseSignup.querySelector('main').getAttribute('lang'),'en');
 assert.equal(signup.querySelector('header').innerHTML,home.querySelector('header').innerHTML);
 assert.equal(signup.querySelectorAll('.header-dropdown').length,3);
 assert.ok((await(await request('/api/search?q=Evelyn')).json()).results.length>0);
 assert.equal((await request('/api/language?preview=draft')).status,403);
 assert.equal((await request('/api/editor',{headers:{cookie:'CF_Authorization=forged','Cf-Access-Authenticated-User-Email':'owner@local.test'}})).status,401);
 const upload=await request('/api/editor/upload',{method:'POST',headers:{...headers,'Content-Type':'image/jpeg'},body:fs.readFileSync('public/assets/community.jpg')});assert.equal(upload.status,200);const {src}=await upload.json();const key=src.slice(7);const kv=await mf.getKVNamespace('PHOTOS');const image=await kv.getWithMetadata(key,{type:'arrayBuffer'});assert.ok(image.value.byteLength>0);
 // Simulate a KV read miss after a successful upload receipt, as can occur at another edge.
 await kv.delete(key);content.photos.hero.src=src;assert.equal((await post('/api/editor/publish',{content,revision:2})).status,200,'Save must use D1 receipt, not a KV read');const retry=await request(src);assert.equal(retry.status,503);assert.equal(retry.headers.get('retry-after'),'5');assert.equal(retry.headers.get('cache-control'),'no-store');
 await kv.put(key,image.value,{metadata:image.metadata});assert.equal((await request(src)).status,200);
 const unknown=structuredClone(content);unknown.photos.hero.src='/media/00000000-0000-0000-0000-000000000000.jpg';assert.equal((await post('/api/editor/save',{content:unknown,revision:3})).status,400);
 assert.ok((await(await request('/sitemap.xml')).text()).includes('https://staging.example/'));assert.equal((await request('/admin',{headers})).status,200);assert.equal((await request('/admin.js',{headers})).status,200);
 console.log('PASS: snapshot draft restoration, publication, every public page in both languages, forms, search, static assets, locked admin, forged credentials, KV propagation miss/retry, and unknown-photo rejection.');
}finally{await mf.dispose();}
