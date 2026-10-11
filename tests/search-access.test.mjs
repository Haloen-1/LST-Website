import {test} from 'node:test';import assert from 'node:assert/strict';
import {defaults} from '../src/content.mjs';import {searchSite} from '../src/search.mjs';
import {allowedOrigin} from '../src/origins.mjs';
test('custom domain requests use an explicit origin allowlist',()=>{
 const env={PUBLIC_ORIGIN:'https://original.example',PUBLIC_ORIGINS:'https://custom.example'};
 for(const origin of ['https://original.example','https://custom.example'])assert.equal(allowedOrigin(new Request('https://original.example',{headers:{origin}}),env),true);
 for(const origin of ['https://custom.example.attacker.test','null','https://unknown.example'])assert.equal(allowedOrigin(new Request('https://custom.example',{headers:{origin}}),env),false);
 assert.equal(allowedOrigin(new Request('https://custom.example'),env),false);
});
test('search includes published collections and excludes hidden records',()=>{
 const c=structuredClone(defaults);c.events.push({...c.events[0],id:'private',title:'Hidden-secret',visible:false});c.timeline.push({...c.timeline[0],id:'hidden',title:'Hidden-secret',visible:false});c.team.push({...c.team[0],name:'Hidden-secret',visible:false});
 assert.deepEqual(searchSite(c,'Hidden-secret'),[]);assert.ok(searchSite(c,'science').some(r=>r.url.startsWith('/events/')));assert.deepEqual(searchSite(c,'  '),[]);assert.ok(searchSite(c,'SCIENCE').length>0);
});
