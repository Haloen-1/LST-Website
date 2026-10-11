import fs from 'node:fs';
import assert from 'node:assert/strict';
import {checkStaging} from './check-staging.mjs';
const config=JSON.parse(fs.readFileSync('wrangler.github.json','utf8'));
assert.deepEqual(checkStaging(config),[]);
assert.equal(config.vars.ADMIN_DISABLED,'true');
for(const [path,status] of [['/',200],['/events',200],['/team?lang=zh',200],['/kits',200],['/admin',403],['/admin.js',403],['/api/editor',401],['/?preview=draft',403]]){
 const response=await fetch(config.vars.PUBLIC_ORIGIN+path,{redirect:'manual',signal:AbortSignal.timeout(30000)});
 assert.equal(response.status,status,path);
 assert.match(response.headers.get('x-robots-tag')||'',/noindex/,path);
 console.log(`Verified ${path}: ${status}`);
}
console.log('Staging is available and the admin is locked. No production domain was checked or modified.');
