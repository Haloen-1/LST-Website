import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {checkStaging} from '../scripts/check-staging.mjs';

const example=JSON.parse(fs.readFileSync('wrangler.staging.example.json','utf8'));
function configured(){const c=structuredClone(example);c.vars={...c.vars,PUBLIC_ORIGIN:'https://little-scientists-staging.test-account.workers.dev',ACCESS_ISSUER:'https://lst-team.cloudflareaccess.com',ACCESS_AUD:'a'.repeat(64),EDITOR_EMAILS:'owner@local.test'};c.d1_databases[0].database_id='12345678-1234-1234-1234-123456789abc';c.kv_namespaces[0].id='a'.repeat(32);return c;}
test('GitHub staging permits absent Access configuration only with an explicit admin lock',()=>{
 const c=JSON.parse(fs.readFileSync('wrangler.github.json','utf8'));
 assert.deepEqual(checkStaging(c),[]);
 for(const value of [undefined,false,'false',true]){const changed=structuredClone(c);changed.vars.ADMIN_DISABLED=value;assert.ok(checkStaging(changed).length);}
 c.routes=['littlescientiststaipei.com/*'];assert.ok(checkStaging(c).length);
});
test('staging guard rejects placeholders and production routes',()=>{
 assert.ok(checkStaging(example).length>0);assert.deepEqual(checkStaging(configured()),[]);
 for(const change of [c=>c.routes=['littlescientiststaipei.com/*'],c=>c.vars.PUBLIC_ORIGIN='https://littlescientiststaipei.com',c=>c.vars.ACCESS_AUD='',c=>c.vars.EDITOR_EMAILS='',c=>c.assets.run_worker_first=[],c=>c.r2_buckets=[],c=>c.env={production:{}}]){const c=configured();change(c);assert.ok(checkStaging(c).length>0);}
});
