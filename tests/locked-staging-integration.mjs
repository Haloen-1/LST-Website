import assert from 'node:assert/strict';
import {harness} from './harness.mjs';
import {stagingPublicationSQL} from '../scripts/prepare-staging-publication.mjs';
const {mf,db,request,headers,post}=await harness({ADMIN_DISABLED:'true'});
try{
 const seed=stagingPublicationSQL();
 // An existing private draft must never be the source of public content.
 const privateDraft=JSON.stringify({text:{heroTitle:'PRIVATE DRAFT DO NOT PUBLISH'}});
 await db.prepare("INSERT INTO site_content VALUES ('site',?,NULL,7,'2026-01-01',NULL)").bind(privateDraft).run();
 await db.prepare(seed).run();
 let record=await db.prepare("SELECT * FROM site_content WHERE id='site'").first();
 assert.equal(record.draft_content,privateDraft);assert.equal(record.revision,8);
 assert.ok(record.published_content);assert.ok(!record.published_content.includes('PRIVATE DRAFT DO NOT PUBLISH'));
 const first=JSON.stringify(record);
 await db.prepare(seed).run();
 assert.equal(JSON.stringify(await db.prepare("SELECT * FROM site_content WHERE id='site'").first()),first);
 for(const route of ['/','/events','/team?lang=zh','/kits']){
  const response=await request(route);assert.equal(response.status,200,route);
  assert.ok(!(await response.text()).includes('PRIVATE DRAFT DO NOT PUBLISH'));
 }
 for(const route of ['/admin','/admin.js','/?preview=draft','/api/language?preview=draft'])assert.equal((await request(route,{headers})).status,403,route);
 assert.equal((await request('/api/editor',{headers})).status,401);
 assert.equal((await post('/api/editor/publish',{content:{},revision:8})).status,401);
 const denied=await(await request('/admin')).text();assert.ok(denied.includes('staging editor is locked'));assert.ok(!denied.includes('Switch account'));
 await db.prepare("DELETE FROM site_content WHERE id='site'").run();
 await db.prepare(seed).run();
 record=await db.prepare("SELECT * FROM site_content WHERE id='site'").first();
 assert.equal(record.revision,1);assert.equal(record.published_content,record.draft_content);
 console.log('PASS: locked staging, valid-token rejection, safe public snapshot seed, preserved private drafts and idempotent publication.');
}finally{await mf.dispose();}
