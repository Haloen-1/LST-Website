import fs from 'node:fs';
import assert from 'node:assert/strict';
import {checkStaging} from './check-staging.mjs';
import {setTimeout as delay} from 'node:timers/promises';
const config=JSON.parse(fs.readFileSync('wrangler.github.json','utf8'));
assert.deepEqual(checkStaging(config),[]);
assert.equal(config.vars.ADMIN_DISABLED,'true');
for(const [path,status] of [['/',200],['/events',200],['/team?lang=zh',200],['/kits',200],['/admin',403],['/admin.js',403],['/api/editor',401],['/?preview=draft',403]]){
 let response;
 // A newly created workers.dev address can briefly return an edge 404 after upload.
 // Only wait for public homepage activation; never retry an exposed admin response.
 for(let attempt=0;attempt<12;attempt++){
  response=await fetch(config.vars.PUBLIC_ORIGIN+path,{redirect:'manual',signal:AbortSignal.timeout(30000)});
  if(path!=='/'||![404,502,503].includes(response.status)||attempt===11)break;
  await response.body?.cancel();
  console.log('Waiting for the new staging address to become available…');
  await delay(5000);
 }
 assert.equal(response.status,status,path);
 assert.match(response.headers.get('x-robots-tag')||'',/noindex/,path);
 console.log(`Verified ${path}: ${status}`);
}
console.log('Staging is available and the admin is locked. No production domain was checked or modified.');
